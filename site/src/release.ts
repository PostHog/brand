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

/** How long an asset counts as new after the release that first shipped it. */
const NEW_FOR_DAYS = 30

/**
 * Whether an asset first shipped within the last {@link NEW_FOR_DAYS} days — or hasn't
 * shipped yet (synced since the last release). Checked against the visitor's clock rather
 * than the build's, so a badge expires on time even if the site isn't redeployed.
 */
export function isNew(since: Release | undefined, now: number = Date.now()): boolean {
  if (!since) return true
  return now - Date.parse(`${since.date}T00:00:00Z`) < NEW_FOR_DAYS * 24 * 60 * 60 * 1000
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
