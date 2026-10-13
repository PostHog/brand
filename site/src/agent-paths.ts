// Where every agent-facing file lives on the site. One module for both sides of the build:
// the `agent/` generators write files at these paths, and the pages and WebMCP tools link to
// them, so a URL can't be documented in one place and served from another.
//
//   /hoggies/<slug>.svg|png        a hoggie (a variant family member is <slug>-<key>)
//   /crests/<slug>.svg|png         a crest's full illustration
//   /crests/<slug>-mini.svg|png    its mini badge
//   /logo/<id>.svg|png             a logo file (see logo-files.ts)
//   /<page>.md                     the markdown twin of every HTML page (/ → /index.md)

import type { CrestTier } from "@posthog/brand"
import { SITE_URL } from "./seo.ts"

export type ImageFormat = "svg" | "png"

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

export function hoggieFilePath(
  slug: string,
  variant: string | undefined,
  format: ImageFormat,
): string {
  return `/hoggies/${hoggieStem(slug, variant)}.${format}`
}

export function crestFilePath(slug: string, tier: CrestTier, format: ImageFormat): string {
  return `/crests/${slug}${tier === "mini" ? "-mini" : ""}.${format}`
}

export function logoFilePath(id: string, format: ImageFormat): string {
  return `/logo/${id}.${format}`
}

/** The markdown twin of a page: `/` → `/index.md`, `/hoggies/chart` → `/hoggies/chart.md`. */
export function markdownPath(pagePath: string): string {
  return pagePath === "/" ? "/index.md" : `${pagePath}.md`
}

/** Absolute URL for a site path. */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path}`
}
