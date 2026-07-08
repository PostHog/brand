// Explicit, opt-in variant groups: a family of numbered Figma hogs (e.g. "noir hog 1",
// "noir hog 2") published as ONE compound component `Hedgehog<Base>` that takes a
// `variant` prop — `<HedgehogNoirHog variant="2" />` — instead of separate
// `HedgehogNoirHog1` / `HedgehogNoirHog2` exports. A hand-maintained presentation layer
// over the raw Figma mirror, exactly like renames.ts: applied by codegen (offline), the
// committed `assets/<ns>/…` files keep the faithful Figma slug, and grouping never
// touches the sync mirror.
//
// Grouping is ALWAYS declared here explicitly, never inferred from a trailing number:
// an automatic convention can't tell a real family ("gladiator 1"/"2") from an orphan
// ("doctor 2", which has no "1") or a mixed set ("magnifying glass" + "magnifying glass
// 2"), and it would silently reshape existing exports. Declaring it by hand keeps the
// public API a deliberate choice.
//
// Keyed by namespace, then by the published BASE slug. `order` lists the variant keys in
// display order; the first is the default (rendered when no `variant` prop is passed).
// `sources` maps each variant key (the `variant` prop value) to the raw Figma (catalog)
// slug in assets/<ns>/catalog.json.

import type { Namespace } from "../../src/types.ts"

export interface VariantGroup {
  /** Ordered variant keys; the first is the default rendered without a `variant` prop. */
  order: string[]
  /** Variant key (the `variant` prop value) -> raw Figma (catalog) slug. */
  sources: Record<string, string>
}

/** `namespace -> published base slug -> group`. */
export const VARIANT_GROUPS: Partial<Record<Namespace, Record<string, VariantGroup>>> = {
  hoggies: {
    construction: { order: ["1", "2"], sources: { "1": "construction-1", "2": "construction-2" } },
    gladiator: { order: ["1", "2"], sources: { "1": "gladiator-1", "2": "gladiator-2" } },
    "lemon-wrangler": {
      order: ["1", "2", "3"],
      sources: { "1": "lemon-wrangler-1", "2": "lemon-wrangler-2", "3": "lemon-wrangler-3" },
    },
    "mr-potato-head": {
      order: ["1", "2"],
      sources: { "1": "mr-potato-head-1", "2": "mr-potato-head-2" },
    },
    "noir-hog": { order: ["1", "2"], sources: { "1": "noir-hog-1", "2": "noir-hog-2" } },
    swimmer: { order: ["1", "2"], sources: { "1": "swimmer-1", "2": "swimmer-2" } },
    wizard: {
      order: ["1", "2", "3", "4"],
      sources: { "1": "wizard-1", "2": "wizard-2", "3": "wizard-3", "4": "wizard-4" },
    },
  },
}

export interface ResolvedVariant {
  /** Published base slug that backs the compound `Hedgehog<Base>` component. */
  baseSlug: string
  /** This source's variant key (the value passed as the `variant` prop). */
  variant: string
  /** Whether this is the group's default variant (rendered when no `variant` prop given). */
  isDefault: boolean
}

/** `namespace -> source slug -> ResolvedVariant`, built once from VARIANT_GROUPS. */
const SOURCE_INDEX: Partial<Record<Namespace, Record<string, ResolvedVariant>>> = (() => {
  const index: Partial<Record<Namespace, Record<string, ResolvedVariant>>> = {}
  for (const [ns, groups] of Object.entries(VARIANT_GROUPS) as [
    Namespace,
    Record<string, VariantGroup>,
  ][]) {
    const forNs: Record<string, ResolvedVariant> = {}
    for (const [baseSlug, group] of Object.entries(groups)) {
      for (const variant of group.order) {
        const sourceSlug = group.sources[variant]
        if (!sourceSlug) throw new Error(`Variant "${baseSlug}"/"${variant}" has no source slug.`)
        forNs[sourceSlug] = { baseSlug, variant, isDefault: variant === group.order[0] }
      }
    }
    index[ns] = forNs
  }
  return index
})()

/** Resolve a raw Figma source slug to its variant-group membership, or undefined if ungrouped. */
export function resolveVariant(
  namespace: Namespace,
  sourceSlug: string,
): ResolvedVariant | undefined {
  return SOURCE_INDEX[namespace]?.[sourceSlug]
}

/** The variant group for a published base slug, or undefined if the slug is not grouped. */
export function variantGroup(namespace: Namespace, baseSlug: string): VariantGroup | undefined {
  return VARIANT_GROUPS[namespace]?.[baseSlug]
}
