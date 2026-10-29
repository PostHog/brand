// Build-time SEO/AEO plugin: head metadata, prerendered route HTML, sitemap.
//
// The site is a client-rendered SPA, so by default every URL would serve the same
// `index.html` — one title, one description, one Open Graph card for the whole site, and a
// `<div id="root">` with no text in it. Googlebot runs JS and would eventually see the real
// pages, but the crawlers that matter most for a reference site like this one do not:
// answer engines (GPTBot, ClaudeBot, PerplexityBot, …) and every social unfurler (Slack,
// X, LinkedIn, iMessage) read the HTML as served.
//
// So this plugin does two things:
//   1. `transformIndexHtml` injects the shared head block — icons, Open Graph, Twitter card,
//      canonical, and site-level JSON-LD — from `src/seo.ts`, in dev and in build alike.
//   2. `closeBundle` stamps out one static HTML file per route from the built `index.html`,
//      swapping that block for the route's own metadata and adding a plain HTML summary of the
//      page (headline, lede, internal links, and for the catalog routes the full asset list;
//      for an asset page, its download URLs and import) in a `<noscript>` after `#root`. A
//      browser running JS never paints it, so it's purely what a non-executing client reads.
//      It also writes `sitemap.xml`, with each asset page's image.
//
// Everything is driven by `PAGES` in `src/seo.ts`, the same table the runtime `useSeo` hook
// reads, so the served HTML and the client-side navigation can never disagree. The asset pages
// (`/hoggies/<slug>`, `/crests/<slug>`) come from the agent catalog (agent/data.ts), which the
// markdown twins, llms.txt and catalog.json are built from too (see agent-plugin.ts).

import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import type { Plugin } from "vite"
import {
  type CatalogAsset,
  type CatalogBadge,
  type CatalogImage,
  imageHeading,
  LICENSE_URL,
  loadAgentData,
} from "./agent/data.ts"
import { absoluteUrl, assetPagePath, markdownPath } from "./src/agent-paths.ts"
import { BADGE_ALT, BADGE_USAGE } from "./src/badge-files.ts"
import { formatReleaseDate } from "./src/release.ts"
import {
  breadcrumbJsonLd,
  crestPageSeo,
  documentTitle,
  hoggiePageSeo,
  OG_IMAGE,
  OG_IMAGE_ALT,
  NOT_FOUND_PAGE,
  type PageSeo,
  PAGES,
  SITE_NAME,
  SITE_URL,
} from "./src/seo.ts"

/** Delimits the per-route head block so `closeBundle` can swap it out of the built HTML. */
const START = "<!--seo:start-->"
const END = "<!--seo:end-->"

const ROOT_DIV = '<div id="root"></div>'

function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/**
 * PostHog as a schema.org `Organization`, field for field as posthog.com describes it
 * (`POSTHOG_ORGANIZATION` in its `src/components/seo.tsx`) — that block exists there so every
 * page describes one entity instead of drifting copies, and this subdomain is one more page.
 * Keep the two in step; re-sync from posthog.com if it changes. The `@id` is posthog.com's,
 * not ours, so a crawler folds both sites' markup into the same organization node.
 */
const ORGANIZATION_ID = "https://posthog.com/#organization"

const POSTHOG_ORGANIZATION = {
  "@type": "Organization",
  "@id": ORGANIZATION_ID,
  name: "PostHog",
  url: "https://posthog.com",
  logo: "https://posthog.com/brand/posthog-logo-stacked.png",
  sameAs: [
    "https://twitter.com/PostHog",
    "https://github.com/PostHog",
    "https://www.linkedin.com/company/posthog",
  ],
  address: {
    "@type": "PostalAddress",
    streetAddress: "2261 Market Street #4008",
    addressLocality: "San Francisco",
    addressRegion: "CA",
    postalCode: "94114",
    addressCountry: "US",
  },
}

/** Site-wide structured data. Emitted on every page; answer engines read it for provenance. */
function siteJsonLd(): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      POSTHOG_ORGANIZATION,
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        inLanguage: "en",
        publisher: { "@id": ORGANIZATION_ID },
      },
      {
        "@type": "SoftwareSourceCode",
        "@id": `${SITE_URL}/#package`,
        name: "@posthog/brand",
        description:
          "PostHog's brand assets as an npm package: the logo, the RoundHog typeface, color tokens, hedgehog illustrations, and team crests, as React components, SVG strings, and PNGs. Works offline.",
        url: `${SITE_URL}/`,
        codeRepository: "https://github.com/PostHog/brand",
        programmingLanguage: "TypeScript",
        runtimePlatform: "React",
        license: "https://polyformproject.org/licenses/strict/1.0.0/",
        author: { "@id": ORGANIZATION_ID },
      },
    ],
  })
}

/** A prerendered route: its metadata, plus the asset it shows when it's an asset page. */
interface Route {
  page: PageSeo
  /** The hoggie or crest an asset page shows. */
  asset?: CatalogAsset
  /** The assets a catalog page lists, linked from its static shell. */
  listing?: CatalogAsset[]
  /** The website badges the badges page shows, with their embed code. */
  badges?: CatalogBadge[]
  /** PNG URLs of the page's images, for the image sitemap. */
  images?: string[]
}

/**
 * schema.org `ImageObject` for an asset page's main image. Search engines use it (with the
 * image sitemap) for image results, including the license fields Google shows as "Licensable".
 */
function imageJsonLd(asset: CatalogAsset, image: CatalogImage, page: PageSeo): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ImageObject",
    name: asset.name,
    description: page.description,
    contentUrl: image.png,
    thumbnailUrl: image.png,
    encodingFormat: "image/png",
    width: image.width,
    height: image.height,
    keywords: asset.tags.join(", "),
    url: absoluteUrl(page.path),
    license: LICENSE_URL,
    acquireLicensePage: LICENSE_URL,
    creditText: "PostHog",
    copyrightNotice: "PostHog, Inc.",
    creator: { "@id": ORGANIZATION_ID },
    associatedMedia: {
      "@type": "MediaObject",
      contentUrl: image.svg,
      encodingFormat: "image/svg+xml",
    },
  })
}

/** The head block for one route, wrapped in the swap markers. */
function headBlock({ page, asset }: Route): string {
  const url = absoluteUrl(page.path)
  const image = asset?.images[0]
  const ogImage = page.image?.url ?? OG_IMAGE
  const ogAlt = page.image?.alt ?? OG_IMAGE_ALT
  // The site card is 1920×1080; an asset's own PNG has its catalog size.
  const [ogWidth, ogHeight] = image ? [image.width, image.height] : [1920, 1080]
  const tags = [
    `<title>${escape(documentTitle(page.title, page.path))}</title>`,
    `<meta name="description" content="${escape(page.description)}" />`,
    // The 404 shell is served under whatever path missed, so it has no canonical of its own.
    // …and has no markdown twin either (agent/markdown.ts writes one per page).
    ...(page.noindex
      ? []
      : [
          `<link rel="canonical" href="${url}" />`,
          `<link rel="alternate" type="text/markdown" href="${absoluteUrl(markdownPath(page.path))}" />`,
        ]),
    `<meta name="robots" content="${page.noindex ? "noindex, follow" : "index, follow, max-image-preview:large"}" />`,

    // Icons, generated by `scripts/gen-brand-icons.ts` from the logo geometry.
    `<link rel="icon" href="/favicon.ico" sizes="32x32" />`,
    `<link rel="icon" href="/favicon.svg" type="image/svg+xml" />`,
    `<link rel="icon" href="/favicon-96x96.png" type="image/png" sizes="96x96" />`,
    `<link rel="apple-touch-icon" href="/apple-touch-icon.png" />`,
    `<link rel="manifest" href="/site.webmanifest" />`,
    `<meta name="apple-mobile-web-app-title" content="${SITE_NAME}" />`,
    `<meta name="theme-color" content="#f4f3ee" />`,
    `<meta name="color-scheme" content="light" />`,

    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:locale" content="en_US" />`,
    `<meta property="og:title" content="${escape(page.title)}" />`,
    `<meta property="og:description" content="${escape(page.description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${ogImage}" />`,
    `<meta property="og:image:type" content="image/png" />`,
    `<meta property="og:image:width" content="${ogWidth}" />`,
    `<meta property="og:image:height" content="${ogHeight}" />`,
    `<meta property="og:image:alt" content="${escape(ogAlt)}" />`,

    // A square asset reads better as a summary card than cropped into a wide one.
    `<meta name="twitter:card" content="${image ? "summary" : "summary_large_image"}" />`,
    `<meta name="twitter:site" content="@PostHog" />`,
    `<meta name="twitter:title" content="${escape(page.title)}" />`,
    `<meta name="twitter:description" content="${escape(page.description)}" />`,
    `<meta name="twitter:image" content="${ogImage}" />`,

    `<script type="application/ld+json" data-seo="site">${siteJsonLd()}</script>`,
    `<script type="application/ld+json" data-seo="breadcrumb">${breadcrumbJsonLd(page.path, page.label, page.parent)}</script>`,
    ...(asset && image
      ? [
          `<script type="application/ld+json" data-seo="image">${imageJsonLd(asset, image, page)}</script>`,
        ]
      : []),
  ]
  return `${START}\n    ${tags.join("\n    ")}\n    ${END}`
}

/**
 * Plain-HTML stand-in for the React tree, written into a `<noscript>` after `#root` on each
 * prerendered route.
 *
 * It exists for clients that never run the bundle: it gives them the page's heading, lede,
 * and links, and — on the catalog routes — the actual asset names, which is the thing an
 * answer engine is being asked about ("does PostHog have a hedgehog holding a…"). An asset
 * page lists its download URLs and import. It's in `<noscript>` rather than inside `#root`
 * so a browser that runs the bundle never paints it: inside `#root` it flashed as unstyled
 * text until React mounted. Crawlers that read the HTML as served still see all of it.
 */
function staticShell({ page, asset, listing, badges }: Route): string {
  const links = PAGES.filter((other) => other.path !== page.path)
    .map((other) => `<a href="${other.path}">${escape(other.label)}</a>`)
    .join(" · ")

  let body = ""
  if (asset) {
    const downloads = asset.images
      .map((image) => {
        return `<li>${escape(imageHeading(asset, image))}: <a href="${image.svg}">SVG</a> · <a href="${image.png}">PNG (${image.width}×${image.height})</a> · <code>${escape(image.jsx)}</code></li>`
      })
      .join("")
    body =
      `<p>Import from <code>${escape(asset.import)}</code>.` +
      `${asset.tags.length ? ` Tags: ${escape(asset.tags.join(", "))}.` : ""}` +
      `${asset.since ? ` Added in v${asset.since.version} (${formatReleaseDate(asset.since.date)}).` : ""}</p>` +
      `<h2>Download</h2><ul>${downloads}</ul>` +
      `<p><a href="${page.parent?.path ?? "/"}">All ${escape(page.parent?.label.toLowerCase() ?? "assets")}</a></p>`
  }

  if (listing) {
    const items = listing
      .map(
        (entry) =>
          `<li><a href="${assetPagePath(entry)}">${escape(entry.name)}</a>: <code>${escape(entry.component)}</code></li>`,
      )
      .join("")
    body = `<h2>All ${listing.length} ${escape(page.label.toLowerCase())}</h2><ul class="prerender-list">${items}</ul>`
  }

  if (badges) {
    const sections = badges
      .map(
        (badge) =>
          `<h2>${escape(badge.name)}</h2>` +
          `<p><img src="${badge.svg}" alt="${escape(BADGE_ALT)}" width="${badge.displaySize.width}" height="${badge.displaySize.height}" /> ${escape(badge.when)}</p>` +
          `<p><a href="${badge.svg}">SVG</a> · <a href="${badge.png}">PNG (${badge.width}×${badge.height})</a></p>` +
          `<p>For a website:</p><pre><code>${escape(badge.html)}</code></pre>` +
          `<p>For a README:</p><pre><code>${escape(badge.markdown)}</code></pre>`,
      )
      .join("")
    const usage = BADGE_USAGE.map((item) => `<li>${escape(item)}</li>`).join("")
    body = `${sections}<h2 id="usage">Using the badges</h2><ul>${usage}</ul>`
  }

  return [
    `<main class="page">`,
    `<h1>${escape(page.headline)}</h1>`,
    `<p>${escape(page.description)}</p>`,
    body,
    page.noindex
      ? ""
      : `<p>For agents: <a href="${markdownPath(page.path)}">this page as markdown</a> · <a href="/llms.txt">llms.txt</a> · <a href="/catalog.json">catalog.json</a></p>`,
    `<nav aria-label="Sections">${links}</nav>`,
    `</main>`,
  ].join("")
}

/**
 * `<urlset>` covering every route, with each page's images (Google image sitemap): an asset
 * page's renderings, every logo file on /logo, and every website badge on /badges.
 */
function sitemap(routes: Route[]): string {
  const urls = routes
    .filter(({ page }) => !page.noindex)
    .map(({ page, images: pngs = [] }) => {
      const images = pngs
        .map((png) => `\n    <image:image><image:loc>${png}</image:loc></image:image>`)
        .join("")
      return `  <url><loc>${absoluteUrl(page.path)}</loc>${images}${images ? "\n  " : ""}</url>`
    })
    .join("\n")
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls}\n</urlset>\n`
}

// No `_redirects` file, on purpose. Cloudflare Pages serves `dist/logo.html` at `/logo` and
// `dist/crests/marketing.html` at `/crests/marketing` by itself, and every URL in the sitemap
// now has such a file, so there is no client-side-only path left to rewrite. Rules would in
// fact break it: `/logo  /logo.html  200` makes Pages apply its own `.html` → extensionless
// redirect to the rewrite target and loop back to `/logo` (this is what broke the first
// preview deploy), and the usual `/*  /index.html  200` SPA fallback is followed whether or
// not an asset matches, so it shadows every prerendered file. Anything genuinely unknown falls
// through to `dist/404.html`, which Pages serves with a real 404 status — better than the soft
// 200 a catch-all gives — and which boots the same app into its `*` route.

export function brandSeo(): Plugin {
  let outDir = "dist"

  return {
    name: "brand-seo",

    configResolved(config) {
      outDir = config.build.outDir
    },

    // Dev and build both get the home page's head block, so `pnpm dev` shows the real
    // title/icons and the built `index.html` carries the tags `closeBundle` swaps per route.
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        const home = PAGES[0]
        return html.replace("<!--seo-->", headBlock({ page: home }))
      },
    },

    async closeBundle() {
      const indexPath = join(outDir, "index.html")
      const built = readFileSync(indexPath, "utf8")
      if (!built.includes(START) || !built.includes(ROOT_DIV)) {
        this.error("brand-seo: built index.html is missing the seo markers or #root")
      }

      const { catalog } = await loadAgentData()
      const listings: Record<string, CatalogAsset[]> = {
        "/hoggies": catalog.hoggies,
        "/crests": catalog.crests,
      }
      const pageImages: Record<string, string[]> = {
        "/logo": catalog.logos.map((logo) => logo.png),
        "/badges": catalog.badges.map((badge) => badge.png),
      }
      const assetRoute = (asset: CatalogAsset, page: PageSeo): Route => ({
        page,
        asset,
        images: asset.images.map((image) => image.png),
      })
      const routes: Route[] = [
        ...PAGES.map((page) => ({
          page,
          listing: listings[page.path],
          badges: page.path === "/badges" ? catalog.badges : undefined,
          images: pageImages[page.path],
        })),
        ...catalog.crests.map((asset) =>
          assetRoute(asset, crestPageSeo(asset.name, asset.slug, asset.tags)),
        ),
        ...catalog.hoggies.map((asset) =>
          assetRoute(
            asset,
            hoggiePageSeo(asset.name, asset.slug, asset.tags, asset.images[0]?.variant),
          ),
        ),
      ]

      for (const route of [...routes, { page: NOT_FOUND_PAGE }]) {
        const { page } = route
        const html = built
          .replace(new RegExp(`${START}[\\s\\S]*?${END}`), headBlock(route))
          .replace(ROOT_DIV, `${ROOT_DIV}<noscript>${staticShell(route)}</noscript>`)
        // `/` → index.html, `/logo` → logo.html and `/crests/x` → crests/x.html (Pages
        // serves both at their extensionless paths), and the 404 shell → the 404.html Pages
        // serves for everything unmatched.
        const file = page.path === "/" ? "index.html" : `${page.path.slice(1)}.html`
        const target = join(outDir, file)
        mkdirSync(dirname(target), { recursive: true })
        writeFileSync(target, html)
      }

      writeFileSync(join(outDir, "sitemap.xml"), sitemap(routes))
      console.log(
        `\nbrand-seo: prerendered ${routes.length} routes + 404.html and sitemap.xml into ${outDir}/`,
      )
    },
  }
}
