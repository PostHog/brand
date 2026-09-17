// Build-time SEO/AEO plugin: head metadata, prerendered route HTML, sitemap, redirects.
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
//      swapping that block for the route's own metadata and filling `#root` with a plain
//      HTML summary of the page (headline, lede, internal links, and for the catalog routes
//      the full asset list). React replaces `#root` the moment it mounts, so this is purely
//      what a non-executing client reads. It also writes `sitemap.xml` and the `_redirects`
//      file that points each route at its own HTML instead of the SPA shell.
//
// Everything is driven by `PAGES` in `src/seo.ts`, the same table the runtime `useSeo` hook
// reads, so the served HTML and the client-side navigation can never disagree.

import { findAssets, getComponentName } from "@posthog/brand"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import type { Plugin } from "vite"
import {
  breadcrumbJsonLd,
  canonicalUrl,
  crestPageSeo,
  documentTitle,
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
          "PostHog's brand assets — logo, RoundHog typeface, color tokens, hedgehog illustrations, and team crests — bundled as React components, SVG strings, and PNGs. Fully offline, no CDN.",
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

/** The head block for one route, wrapped in the swap markers. */
function headBlock(page: PageSeo): string {
  const url = canonicalUrl(page.path)
  const tags = [
    `<title>${escape(documentTitle(page.title, page.path))}</title>`,
    `<meta name="description" content="${escape(page.description)}" />`,
    // The 404 shell is served under whatever path missed, so it has no canonical of its own.
    ...(page.noindex ? [] : [`<link rel="canonical" href="${url}" />`]),
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
    `<meta property="og:image" content="${OG_IMAGE}" />`,
    `<meta property="og:image:type" content="image/png" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${escape(OG_IMAGE_ALT)}" />`,

    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:site" content="@PostHog" />`,
    `<meta name="twitter:title" content="${escape(page.title)}" />`,
    `<meta name="twitter:description" content="${escape(page.description)}" />`,
    `<meta name="twitter:image" content="${OG_IMAGE}" />`,

    `<script type="application/ld+json" data-seo="site">${siteJsonLd()}</script>`,
    `<script type="application/ld+json" data-seo="breadcrumb">${breadcrumbJsonLd(page.path, page.label)}</script>`,
  ]
  return `${START}\n    ${tags.join("\n    ")}\n    ${END}`
}

/**
 * Plain-HTML stand-in for the React tree, written into `#root` of each prerendered route.
 *
 * It exists for clients that never run the bundle: it gives them the page's heading, lede,
 * and links, and — on the catalog routes — the actual asset names, which is the thing an
 * answer engine is being asked about ("does PostHog have a hedgehog holding a…"). React's
 * `createRoot(...).render()` clears the container on mount, so the browser shows it only
 * for the moment before hydration.
 */
function staticShell(page: PageSeo): string {
  const links = PAGES.filter((other) => other.path !== page.path)
    .map((other) => `<a href="${other.path}">${escape(other.label)}</a>`)
    .join(" · ")

  let catalog = ""
  const crestSlug = page.path.startsWith("/crests/") ? page.path.slice("/crests/".length) : ""
  if (crestSlug) {
    const base = getComponentName("crests", crestSlug, "full")
    const mini = getComponentName("crests", crestSlug, "mini")
    catalog =
      `<p>Import from <code>@posthog/brand/crests</code>: <code>&lt;${escape(base)} /&gt;</code>` +
      ` for the full illustration, <code>&lt;${escape(mini)} /&gt;</code> for the badge.</p>` +
      `<p><a href="/crests">All crests</a></p>`
  }

  if (page.path === "/hoggies" || page.path === "/crests") {
    const namespace = page.path === "/hoggies" ? "hoggies" : "crests"
    const assets = findAssets(
      namespace === "crests" ? { namespace, tier: "full" } : { namespace },
    ).sort((a, b) => a.name.localeCompare(b.name))
    const items = assets
      .map((asset) => {
        // Members of a variant family share one component name, so the key disambiguates
        // them the same way the real import does: <HedgehogWizard variant="3" />.
        const key = asset.variant?.variant
        const component =
          getComponentName(namespace, asset.slug, asset.tier) + (key ? ` variant="${key}"` : "")
        const href = namespace === "crests" ? ` href="/crests/${asset.slug}"` : ""
        const name = escape(asset.name)
        // Tags carry the subject words ("car", "driving") that the display name often omits,
        // so a crawler asked for a hedgehog in a car can only find one if they are here.
        const tags = asset.tags?.length ? ` — ${escape(asset.tags.join(", "))}` : ""
        return `<li>${href ? `<a${href}>${name}</a>` : name} — <code>${escape(component)}</code>${tags}</li>`
      })
      .join("")
    catalog = `<h2>All ${assets.length} ${namespace}</h2><ul class="prerender-list">${items}</ul>`
  }

  return [
    `<main class="page">`,
    `<h1>${escape(page.headline)}</h1>`,
    `<p>${escape(page.description)}</p>`,
    catalog,
    `<nav aria-label="Sections">${links}</nav>`,
    `</main>`,
  ].join("")
}

/** `<urlset>` covering every static route plus one page per crest. */
function sitemap(): string {
  const paths = [
    ...PAGES.map((page) => page.path),
    ...findAssets({ namespace: "crests", tier: "full" })
      .map((asset) => `/crests/${asset.slug}`)
      .sort(),
  ]
  const urls = paths.map((path) => `  <url><loc>${canonicalUrl(path)}</loc></url>`).join("\n")
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

/**
 * `/llms.txt` — the emerging convention for handing an LLM a compact, plain-markdown map of
 * a site instead of making it scrape and strip HTML. Cheap to serve and exactly the shape of
 * question this site gets asked ("which PostHog hedgehog illustrations exist?"), so it lists
 * every page plus the full catalog by display name, component name, and search tags.
 */
function llmsTxt(): string {
  const catalog = (namespace: "hoggies" | "crests") =>
    findAssets(namespace === "crests" ? { namespace, tier: "full" } : { namespace })
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((asset) => {
        const key = asset.variant?.variant
        const component =
          getComponentName(namespace, asset.slug, asset.tier) + (key ? ` variant="${key}"` : "")
        const tags = asset.tags?.length ? ` — tags: ${asset.tags.join(", ")}` : ""
        return `- ${asset.name} — \`${component}\` (slug: ${asset.slug})${tags}`
      })

  const hoggies = catalog("hoggies")
  const crests = catalog("crests")

  return [
    `# ${SITE_NAME}`,
    "",
    `> ${PAGES[0].description}`,
    "",
    "Install with `pnpm add @posthog/brand`. Everything ships offline — React components, inline",
    "SVG strings, PNG URLs, and typed color tokens — with no CDN at runtime. Source:",
    "https://github.com/PostHog/brand",
    "",
    "## Pages",
    "",
    ...PAGES.map((page) => `- [${page.label}](${canonicalUrl(page.path)}): ${page.description}`),
    "",
    `## Hedgehog illustrations (${hoggies.length})`,
    "",
    'Import from `@posthog/brand/hoggies`, e.g. `import { HedgehogChart } from "@posthog/brand/hoggies"`.',
    "",
    ...hoggies,
    "",
    `## Team crests (${crests.length})`,
    "",
    "Import from `@posthog/brand/crests`. Each is a compound component: the base is the full",
    "illustration, `.Mini` is the badge tier.",
    "",
    ...crests,
    "",
  ].join("\n")
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
        return html.replace("<!--seo-->", headBlock(home))
      },
    },

    closeBundle() {
      const indexPath = join(outDir, "index.html")
      const built = readFileSync(indexPath, "utf8")
      if (!built.includes(START) || !built.includes(ROOT_DIV)) {
        this.error("brand-seo: built index.html is missing the seo markers or #root")
      }

      const crestPages = findAssets({ namespace: "crests", tier: "full" }).map((asset) =>
        crestPageSeo(asset.name, asset.slug),
      )

      for (const page of [...PAGES, ...crestPages, NOT_FOUND_PAGE]) {
        const html = built
          .replace(new RegExp(`${START}[\\s\\S]*?${END}`), headBlock(page))
          .replace(ROOT_DIV, `<div id="root">${staticShell(page)}</div>`)
        // `/` → index.html, `/logo` → logo.html and `/crests/x` → crests/x.html (Pages
        // serves both at their extensionless paths), and the 404 shell → the 404.html Pages
        // serves for everything unmatched.
        const file = page.path === "/" ? "index.html" : `${page.path.slice(1)}.html`
        const target = join(outDir, file)
        mkdirSync(dirname(target), { recursive: true })
        writeFileSync(target, html)
      }

      writeFileSync(join(outDir, "sitemap.xml"), sitemap())
      writeFileSync(join(outDir, "llms.txt"), llmsTxt())
      console.log(
        `\nbrand-seo: prerendered ${PAGES.length + crestPages.length} routes + 404.html, ` +
          `sitemap.xml and llms.txt into ${outDir}/`,
      )
    },
  }
}
