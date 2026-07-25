// The published React component export names for a set of raw Figma (catalog) entries,
// after the two offline presentation layers are applied: renames (renames.ts) rewrite a
// poorly-named slug, and variant grouping (variants.ts) collapses a numbered family onto
// its base slug. These are the identities the breaking-change guard in sync.ts (and the
// changeset writer) compare committed vs freshly-discovered assets on — a sync must never
// make one of these disappear.
//
// Necessarily whole-set rather than per-slug: variant grouping is inferred from the slugs
// around an asset (a `foo-2` is variant "2" of `foo` only when no bare `foo` exists), so
// an entry's published name isn't knowable in isolation.

import { applyRename } from "./renames.ts"
import { inferVariants } from "./variants.ts"
import { componentName } from "../../src/naming.ts"
import type { CrestTier, Namespace } from "../../src/types.ts"

export interface PublishableEntry {
  slug: string
  name: string
  tier?: CrestTier
}

/**
 * The published component name of every entry, parallel to the input. Grouped by crest
 * tier first, since slugs (and so variant families) are unique per (namespace, tier).
 */
export function publishedComponentNames(
  namespace: Namespace,
  entries: readonly PublishableEntry[],
): string[] {
  const renamed = entries.map((e) => applyRename(namespace, e.slug, e.name).slug)
  const byTier = new Map<CrestTier | undefined, string[]>()
  entries.forEach((e, i) => {
    const slugs = byTier.get(e.tier) ?? []
    slugs.push(renamed[i]!)
    byTier.set(e.tier, slugs)
  })
  const indexes = new Map([...byTier].map(([tier, slugs]) => [tier, inferVariants(slugs)] as const))

  return entries.map((entry, i) => {
    const slug = renamed[i]!
    const variant = indexes.get(entry.tier)!.resolve(slug)
    return componentName(namespace, variant ? variant.baseSlug : slug, entry.tier)
  })
}
