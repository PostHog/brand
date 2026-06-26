// Pure search/filter helpers over the bundled cross-namespace manifest.
// No React, no image payload — safe to import when building a picker.

import { allAssets } from "./generated/manifest.ts"
import type { AssetMeta, CrestTier, Namespace } from "./types.ts"

export interface FindAssetsFilter {
  /** Substring match across name, slug, and tags (case-insensitive). */
  text?: string
  /** Restrict to one or more namespaces. */
  namespace?: Namespace | Namespace[]
  /** Restrict to one or more crest tiers (`full` / `mini`). Non-crest assets have no tier. */
  tier?: CrestTier | CrestTier[]
  /** Match assets whose variant props include all of these key/value pairs. */
  variant?: Record<string, string>
  /** Match assets whose tags include every one of these (case-insensitive, exact tag). */
  tags?: string | string[]
}

function matchesOneOf<T>(value: T, filter: T | T[] | undefined): boolean {
  if (filter === undefined) return true
  return Array.isArray(filter) ? filter.includes(value) : value === filter
}

function matches(asset: AssetMeta, filter: FindAssetsFilter): boolean {
  if (!matchesOneOf(asset.namespace, filter.namespace)) return false
  if (filter.tier !== undefined && !matchesOneOf(asset.tier, filter.tier)) return false

  if (filter.variant) {
    const have = asset.variant ?? {}
    for (const [k, v] of Object.entries(filter.variant)) {
      if (have[k] !== v) return false
    }
  }

  if (filter.tags !== undefined) {
    const want = (Array.isArray(filter.tags) ? filter.tags : [filter.tags])
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
    const have = new Set((asset.tags ?? []).map((t) => t.toLowerCase()))
    if (!want.every((t) => have.has(t))) return false
  }

  if (filter.text?.trim()) {
    const q = filter.text.trim().toLowerCase()
    const haystack = `${asset.name} ${asset.slug} ${(asset.tags ?? []).join(" ")}`.toLowerCase()
    if (!haystack.includes(q)) return false
  }

  return true
}

/** Returns every asset matching `filter` (empty filter returns all of them). */
export function findAssets(filter: FindAssetsFilter = {}): AssetMeta[] {
  return allAssets.filter((asset) => matches(asset, filter))
}

/**
 * Looks up a single asset's metadata by namespace + slug. For crests a slug is shared by
 * the full and mini tiers, so pass `tier` to disambiguate (otherwise the first match wins).
 */
export function getAsset(
  namespace: Namespace,
  slug: string,
  tier?: CrestTier,
): AssetMeta | undefined {
  return allAssets.find(
    (a) => a.namespace === namespace && a.slug === slug && (tier === undefined || a.tier === tier),
  )
}
