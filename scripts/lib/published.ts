// The published React component export name for a raw Figma (catalog) slug, after the
// two offline presentation layers are applied: variant grouping (variants.ts) collapses
// a numbered family onto its base slug, and renames (renames.ts) rewrite a poorly-named
// slug. This is the identity the breaking-change guard in sync.ts compares committed vs
// freshly-discovered assets on — a sync must never make one of these disappear.

import { applyRename } from "./renames.ts"
import { resolveVariant } from "./variants.ts"
import { componentName } from "../../src/naming.ts"
import type { CrestTier, Namespace } from "../../src/types.ts"

export function publishedComponentName(
  namespace: Namespace,
  sourceSlug: string,
  name: string,
  tier?: CrestTier,
): string {
  const variant = resolveVariant(namespace, sourceSlug)
  const slug = variant ? variant.baseSlug : applyRename(namespace, sourceSlug, name).slug
  return componentName(namespace, slug, tier)
}
