// The "Built with PostHog" website badges: one table shared by the Badges page, the build
// (`agent/`), which renders each badge to `/badges/<id>.svg` and `/badges/<id>.png` and lists
// them in the markdown, llms.txt and catalog.json, and the WebMCP tools. The embed code and the
// usage terms live here too, so the page, the docs and the catalog can't drift apart.

import { absoluteUrl, assetFilePath, type ImageFormat } from "./agent-paths.ts"

export interface Badge {
  /** File stem and stable id: `/badges/<id>.svg`. */
  id: string
  name: string
  /** When to use it. */
  when: string
  /** The background it is made for. Both have their own plate, so either works anywhere. */
  background: "light" | "dark"
}

export const BADGES: readonly Badge[] = [
  {
    id: "posthog-badge",
    name: "Standard badge",
    when: "For light backgrounds. Use it by default.",
    background: "light",
  },
  {
    id: "posthog-badge-dark",
    name: "Dark badge",
    when: "For dark backgrounds. It uses the light (white) logo.",
    background: "dark",
  },
]

/**
 * The size every badge is drawn and embedded at, in px. The logo inside is then 80 px wide,
 * the smallest the full logo goes.
 */
export const BADGE_SIZE: { readonly width: number; readonly height: number } = {
  width: 100,
  height: 50,
}

/** The PNG is this many times {@link BADGE_SIZE}, sharp on 3x screens and in email. */
export const BADGE_PNG_SCALE = 3

export const BADGE_ALT = "Built with PostHog"

/** Absolute URL of a badge's static file. */
export function badgeUrl(badge: Badge, format: ImageFormat): string {
  return absoluteUrl(assetFilePath({ type: "badge", slug: badge.id }, format))
}

/**
 * Where a badge links. `utm_source=badge` is what the old badges sent, so the numbers stay
 * comparable; `utm_content` tells these embeds apart from the old ones.
 */
export function badgeLink(badge: Badge): string {
  return `https://posthog.com/?utm_source=badge&utm_medium=referral&utm_content=${badge.id}`
}

/**
 * Embed code for a website. Line breaks fall between attributes, so no stray space is linked,
 * and the `<img />` is self-closed, so it pastes into JSX unchanged.
 */
export function badgeHtml(badge: Badge): string {
  const { width, height } = BADGE_SIZE
  return [
    `<a href="${badgeLink(badge)}"`,
    `  target="_blank" rel="noopener"><img src="${badgeUrl(badge, "svg")}"`,
    `  alt="${BADGE_ALT}" width="${width}" height="${height}" /></a>`,
  ].join("\n")
}

/** Embed code for a README. */
export function badgeMarkdown(badge: Badge): string {
  return `[![${BADGE_ALT}](${badgeUrl(badge, "svg")})](${badgeLink(badge)})`
}

/** Who can show the badges, and how. The one permission PostHog gives for these files. */
export const BADGE_USAGE: readonly string[] = [
  "You can show these badges on your website, app, docs, or README if your product or project uses PostHog.",
  "Use the files as they are. Don't recolor, crop, stretch, or redraw them, and don't show them smaller than 100×50 px.",
  "Don't use a badge to suggest that PostHog endorses your product or partners with you.",
  "We can ask you to take a badge down at any time.",
  "This permission covers only these badges.",
]
