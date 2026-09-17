// Pure search/filter helpers over the bundled cross-namespace manifest.
// No React, no image payload — safe to import when building a picker.

import { allAssets } from "./generated/manifest.ts"
import { componentName } from "./naming.ts"
import type { AssetMeta, CrestTier, Namespace } from "./types.ts"

export interface FindAssetsFilter {
  /**
   * Free-text match across name, slug, component name, and tags (case-insensitive). The
   * query is split into words, and every word must match somewhere — so "hog car" and
   * "hedgehog in a car" both find a car-tagged hog whose name says neither.
   */
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

/**
 * English filler words, dropped from a free-text query. Without this a written-out request
 * ("a hedgehog in a car") would only match assets that happen to carry "in" or "a" as a
 * substring somewhere, which is chance rather than relevance.
 */
const STOP_WORDS: ReadonlySet<string> = new Set([
  "a",
  "an",
  "and",
  "at",
  "for",
  "in",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
])

/**
 * Splits a query into the words that must each match. Apostrophes and hyphens stay inside a
 * word so "i'm" and "driving-hogzilla" keep matching the name and slug they came from.
 */
function queryWords(text: string): string[] {
  const words = text
    .toLowerCase()
    .split(/[^\p{L}\p{N}'-]+/u)
    .filter(Boolean)
  const content = words.filter((word) => !STOP_WORDS.has(word))
  // A query of nothing but filler words still has to match something.
  return content.length > 0 ? content : words
}

const haystacks = new WeakMap<AssetMeta, string>()

/**
 * Everything a free-text query is matched against, lower-cased. Cached per asset: the
 * manifest is static, and a picker re-filters all of it on every keystroke.
 */
function haystack(asset: AssetMeta): string {
  let hay = haystacks.get(asset)
  if (hay === undefined) {
    const component = componentName(asset.namespace, asset.slug, asset.tier)
    hay = `${asset.name} ${asset.slug} ${component} ${(asset.tags ?? []).join(" ")}`.toLowerCase()
    haystacks.set(asset, hay)
  }
  return hay
}

function matchesOneOf<T>(value: T, filter: T | T[] | undefined): boolean {
  if (filter === undefined) return true
  return Array.isArray(filter) ? filter.includes(value) : value === filter
}

function matches(asset: AssetMeta, filter: FindAssetsFilter, words: readonly string[]): boolean {
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

  if (words.length > 0) {
    const hay = haystack(asset)
    if (!words.every((word) => hay.includes(word))) return false
  }

  return true
}

/** Returns every asset matching `filter` (empty filter returns all of them). */
export function findAssets(filter: FindAssetsFilter = {}): AssetMeta[] {
  const words = filter.text?.trim() ? queryWords(filter.text) : []
  return allAssets.filter((asset) => matches(asset, filter, words))
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
