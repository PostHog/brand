// The package release this site was built from, and when each asset first shipped — both read
// from `@posthog/brand` (`release`, `AssetMeta.since`), which the Release workflow stamps.

import type { AssetMeta, Release } from "@posthog/brand"

export { release } from "@posthog/brand"

/** The GitHub release (changelog) of a version. */
export function releaseUrl(version: string): string {
  return `https://github.com/PostHog/brand/releases/tag/v${version}`
}

/** `2026-10-14` → "Oct 14, 2026". Pinned locale and zone, so every visitor reads the same day. */
export function formatReleaseDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

/**
 * The earliest release that shipped any of `assets` — a variant family or a crest's two
 * tiers count from their oldest member. Undefined when none has shipped yet.
 */
export function earliestSince(assets: readonly (AssetMeta | undefined)[]): Release | undefined {
  return assets
    .map((asset) => asset?.since)
    .filter((since): since is Release => since !== undefined)
    .sort((a, b) => a.version.localeCompare(b.version, "en", { numeric: true }))[0]
}
