// Where every page and agent-facing file lives on the site. One module for both sides of the
// build: the `agent/` generators write files at these paths, and the pages, SEO metadata and
// WebMCP tools link to them, so a URL can't be documented in one place and served from another.
//
//   /hoggies/<slug>.svg|png        a hoggie (a variant family member is <slug>-<key>)
//   /crests/<slug>.svg|png         a crest's full illustration
//   /crests/<slug>-mini.svg|png    its mini badge
//   /logo/<id>.svg|png             a logo file (see logo-files.ts)
//   /<page>.md                     the markdown twin of every HTML page (/ → /index.md)

import type { CrestTier } from "@posthog/brand"

/** Canonical origin. Deployed from `main` to Cloudflare Pages. */
export const SITE_URL = "https://brand.posthog.com"

export type ImageFormat = "svg" | "png"

/** An asset that has static files: a hoggie (or one variant), a crest tier, or a logo file. */
export interface AssetRef {
  type: "hoggie" | "crest" | "logo"
  /** The hoggie/crest slug, or the logo file id (e.g. `posthog-logo-stacked-white`). */
  slug: string
  /** A hoggie variant family member's key, e.g. "2". */
  variant?: string
  tier?: CrestTier
}

/** A hoggie's file stem: its slug, or `<slug>-<key>` for a member of a variant family. */
export function hoggieStem(slug: string, variant?: string): string {
  return variant ? `${slug}-${variant}` : slug
}

export function hoggiePagePath(slug: string): string {
  return `/hoggies/${slug}`
}

export function crestPagePath(slug: string): string {
  return `/crests/${slug}`
}

/** The detail page of a hoggie or crest. */
export function assetPagePath({ type, slug }: { type: "hoggie" | "crest"; slug: string }): string {
  return type === "hoggie" ? hoggiePagePath(slug) : crestPagePath(slug)
}

/** File stem of an asset under its section, e.g. `noir-5`, `marketing-mini`. */
function stem({ type, slug, variant, tier }: AssetRef): string {
  if (type === "hoggie") return hoggieStem(slug, variant)
  if (type === "crest" && tier === "mini") return `${slug}-mini`
  return slug
}

const SECTION: Record<AssetRef["type"], string> = {
  hoggie: "hoggies",
  crest: "crests",
  logo: "logo",
}

/** Site path of an asset's static file, e.g. `/crests/marketing-mini.png`. */
export function assetFilePath(asset: AssetRef, format: ImageFormat): string {
  return `/${SECTION[asset.type]}/${stem(asset)}.${format}`
}

/** Base name (no extension) a downloaded copy is saved as, e.g. `posthog-hedgehog-noir-5`. */
export function assetFileName(asset: AssetRef): string {
  if (asset.type === "logo") return asset.slug
  return `posthog-${asset.type === "hoggie" ? "hedgehog" : "crest"}-${stem(asset)}`
}

/** The markdown twin of a page: `/` → `/index.md`, `/hoggies/chart` → `/hoggies/chart.md`. */
export function markdownPath(pagePath: string): string {
  return pagePath === "/" ? "/index.md" : `${pagePath}.md`
}

/** Absolute (and canonical) URL for a site path. */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path}`
}
