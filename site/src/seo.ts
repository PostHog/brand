// Single source of truth for the site's page metadata.
//
// Used twice, from both sides of the build:
//   • at runtime by `useSeo` (src/useSeo.ts), which rewrites <title>/<meta>/<link rel=canonical>
//     as you navigate the SPA, and
//   • at build time by `seo-plugin.ts`, which bakes the same values into one static HTML file
//     per route so crawlers that do not execute JavaScript (most LLM/answer-engine fetchers,
//     and every social-card unfurler) see real per-page metadata instead of the SPA shell.
// Keeping both readers on this one table is what stops the two from drifting.

import {
  absoluteUrl,
  assetFilePath,
  crestPagePath,
  hoggiePagePath,
  SITE_URL,
} from "./agent-paths.ts"

export { SITE_URL }
export const SITE_NAME = "PostHog Brand"

/** Social card: a designed 1920×1080 illustration committed at `site/public/og.png`. */
export const OG_IMAGE = `${SITE_URL}/og.png`
export const OG_IMAGE_ALT =
  "“PostHog Brand” beside a hedgehog painting the PostHog logo on an easel"

export interface PageSeo {
  /** Route path, without a trailing slash (`/` for the home page). */
  path: string
  /** `<title>`, minus the site-name suffix. */
  title: string
  description: string
  /** Breadcrumb label — usually the nav label rather than the full title. */
  label: string
  /** Static-shell heading + lede used by the prerendered HTML (see `seo-plugin.ts`). */
  headline: string
  /** Keep the page out of search results, and out of the sitemap and nav (the 404 shell). */
  noindex?: boolean
  /** The section a detail page sits under, for its breadcrumb trail. */
  parent?: { path: string; label: string }
  /** The page's own share image (an asset page's PNG); the site card otherwise. */
  image?: PageImage
}

export interface PageImage {
  /** Absolute URL. */
  url: string
  alt: string
}

/**
 * Every prerendered route, in nav order. `/crests/:slug` and `/hoggies/:slug` are deliberately
 * absent: they are generated per asset (see `crestPageSeo` / `hoggiePageSeo`), and listed in
 * the sitemap by the build plugin rather than hard-coded here.
 */
export const PAGES: PageSeo[] = [
  {
    path: "/",
    title: "PostHog brand assets: logo, colors, hedgehogs and crests",
    label: "Overview",
    headline: "PostHog brand assets",
    description:
      "The PostHog logo, the RoundHog typeface, brand colors, 160+ hedgehog illustrations and the team crests. Download them or install the @posthog/brand React package.",
  },
  {
    path: "/logo",
    title: "PostHog logo",
    label: "Logo",
    headline: "The PostHog logo",
    description:
      "Every PostHog logo lockup from one React component: landscape, stacked, logomark and wordmark, in gradient, 4-color print or mono. Click the logomark and it jumps.",
  },
  {
    path: "/fonts",
    title: "RoundHog, the PostHog brand typeface",
    label: "Fonts",
    headline: "RoundHog, PostHog's typeface",
    description:
      "PostHog's brand typeface, bundled as eight woff2 faces (Regular, Medium, SemiBold and Bold, upright and italic) with the @font-face CSS to load them offline.",
  },
  {
    path: "/colors",
    title: "PostHog brand colors",
    label: "Colors",
    headline: "The PostHog color palette",
    description:
      "PostHog's brand colors, with hex values for each core, lighter and darker tone and its gradient. Click to copy, or use them as CSS custom properties and typed JS tokens.",
  },
  {
    path: "/crests",
    title: "PostHog team crests",
    label: "Crests",
    headline: "PostHog team crests",
    description:
      "All of PostHog's team crests, each as a full illustration and a mini badge. Import them from @posthog/brand as React components, SVG strings or PNGs.",
  },
  {
    path: "/hoggies",
    title: "PostHog hedgehogs (hoggies)",
    label: "Hoggies",
    headline: "Hoggies, PostHog's hedgehogs",
    description:
      "Search 160+ PostHog hedgehog illustrations (we call them hoggies) and copy the import for any of them. Each one ships as a React component, an SVG string and a PNG.",
  },
]

/**
 * The shell Cloudflare Pages serves — with a real 404 status — for any path that is neither
 * a prerendered route nor a crest. Not in `PAGES`: it must stay out of the sitemap, the
 * cross-page link list, and search results.
 */
export const NOT_FOUND_PAGE: PageSeo = {
  path: "/404",
  title: "Page not found",
  label: "404",
  headline: "Nothing here but spikes",
  description: "There's no page at this address on brand.posthog.com.",
  noindex: true,
}

/** ", tagged a, b and c." — the tags, as the tail of a description sentence. */
function tagPhrase(tags: readonly string[] | undefined): string {
  const list = [...new Set((tags ?? []).map((t) => t.toLowerCase()))].slice(0, 6)
  if (list.length === 0) return ""
  const last = list.pop()
  return list.length ? ` Tagged ${list.join(", ")} and ${last}.` : ` Tagged ${last}.`
}

/**
 * Metadata for one crest's own page. Shared so the prerendered `/crests/<slug>.html` and the
 * client-side `CrestDetailPage` describe a crest the same way.
 */
export function crestPageSeo(name: string, slug: string, tags?: readonly string[]): PageSeo {
  return {
    path: crestPagePath(slug),
    title: `${name} crest`,
    label: name,
    headline: `The ${name} crest`,
    description: `The ${name} team crest from PostHog, as a full illustration and a mini badge. Download the SVG or PNG, or import it from @posthog/brand as a React component.${tagPhrase(tags)}`,
    parent: { path: "/crests", label: "Crests" },
    image: {
      url: absoluteUrl(assetFilePath({ type: "crest", slug, tier: "full" }, "png")),
      alt: `The PostHog ${name} team crest`,
    },
  }
}

/**
 * Metadata for one hoggie's own page (a variant family shares one page). Shared by the
 * prerendered `/hoggies/<slug>.html` and the client-side `HoggieDetailPage`.
 */
export function hoggiePageSeo(
  name: string,
  slug: string,
  tags?: readonly string[],
  /** The family's first member key, when it's a variant family: its PNG is the share image. */
  firstVariant?: string,
): PageSeo {
  return {
    path: hoggiePagePath(slug),
    title: `${name}, a PostHog hedgehog illustration`,
    label: name,
    headline: `${name}, a PostHog hedgehog`,
    description: `${name} is one of PostHog's hedgehog illustrations, which we call hoggies. Download the SVG or PNG, or import it from @posthog/brand as a React component.${tagPhrase(tags)}`,
    parent: { path: "/hoggies", label: "Hoggies" },
    image: {
      url: absoluteUrl(assetFilePath({ type: "hoggie", slug, variant: firstVariant }, "png")),
      alt: `${name}, a PostHog hedgehog illustration`,
    },
  }
}

/** Exact-path lookup; returns `undefined` for dynamic or unknown routes. */
export function pageSeo(pathname: string): PageSeo | undefined {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname
  return PAGES.find((page) => page.path === path)
}

/** `<title>` text for a page — the home page already reads as a full title on its own. */
export function documentTitle(title: string, path: string): string {
  return path === "/" ? title : `${title} · ${SITE_NAME}`
}

/**
 * schema.org breadcrumb trail for a page. Answer engines and search results use it to show
 * where a page sits, and it is cheap to emit for a three-level site.
 */
export function breadcrumbJsonLd(
  path: string,
  label: string,
  parent?: { path: string; label: string },
): string {
  const items = [{ name: SITE_NAME, item: absoluteUrl("/") }]
  if (parent) items.push({ name: parent.label, item: absoluteUrl(parent.path) })
  if (path !== "/") items.push({ name: label, item: absoluteUrl(path) })
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((entry, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: entry.name,
      item: entry.item,
    })),
  })
}
