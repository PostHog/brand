// Variant families, inferred from the slugs themselves: a family of numbered Figma hogs
// (e.g. "noir 1" … "noir 5") is published as ONE compound component `Hedgehog<Base>` that
// takes a `variant` prop — `<HedgehogNoir variant="2" />` — instead of separate
// `HedgehogNoir1` … `HedgehogNoir5` exports. A presentation layer over the raw Figma
// mirror, exactly like renames.ts: applied by codegen (offline), the committed
// `assets/<ns>/…` files keep the faithful Figma slug, and grouping never touches the sync
// mirror.
//
// The rule is mechanical, so a Figma rename can't leave a hand-maintained list stale:
//
//   1. A slug ending in `-<digits>` is variant `<digits>` of the base slug before it —
//      `mr-potato-head-2` -> base `mr-potato-head`, variant `"2"`.
//   2. Variants are ordered numerically ascending; the lowest is the default (rendered
//      when no `variant` prop is passed).
//   3. EXCEPT when the bare base slug also exists in the same set. That is the signature
//      of a `dedupeSlugs` (src/naming.ts) artifact — two Figma nodes with the same name,
//      where the first won the bare slug and the second got `-2` — not a real family. Such
//      a slug stays a standalone `Hedgehog<Base>2` component.
//   4. A lone numbered slug (a `foo-2` with no `foo-1`) still becomes a one-variant
//      compound, so the export name doesn't churn if its siblings land in a later sync.
//
// The index is built over *published* slugs — renames (renames.ts) apply first, which is
// what keeps `9-9-6` (published as `996`) from reading as variant "6" of a base `9-9`.
// Because slugs are unique per (namespace, crest tier), the caller builds one index per
// export group.

/** Matches a trailing numeric variant suffix: "noir-5" -> base "noir", variant "5". */
const VARIANT_SUFFIX = /^(.+)-(\d+)$/

export interface ResolvedVariant {
  /** Published base slug that backs the compound `Hedgehog<Base>` component. */
  baseSlug: string
  /** This slug's variant key (the value passed as the `variant` prop). */
  variant: string
  /** Whether this is the family's default variant (rendered when no `variant` prop given). */
  isDefault: boolean
}

/** Published slug -> variant-family membership, for one export group's slug set. */
export interface VariantIndex {
  /** The slug's family membership, or undefined when it is a standalone asset. */
  resolve(publishedSlug: string): ResolvedVariant | undefined
}

/**
 * Build the variant index for one export group from its full set of *published* slugs
 * (post-rename). See the rules at the top of this file.
 */
export function inferVariants(slugs: Iterable<string>): VariantIndex {
  const all = new Set(slugs)

  // base slug -> its members, so the default (lowest-numbered) is known up front.
  const families = new Map<string, { slug: string; variant: string }[]>()
  for (const slug of all) {
    const match = VARIANT_SUFFIX.exec(slug)
    if (!match) continue
    const [, baseSlug, variant] = match as unknown as [string, string, string]
    if (all.has(baseSlug)) continue // rule 3: a dedupeSlugs artifact, not a family
    const found = families.get(baseSlug) ?? []
    found.push({ slug, variant })
    families.set(baseSlug, found)
  }

  const index = new Map<string, ResolvedVariant>()
  for (const [baseSlug, found] of families) {
    const ordered = [...found].sort((a, b) => Number(a.variant) - Number(b.variant))
    for (const member of ordered) {
      index.set(member.slug, {
        baseSlug,
        variant: member.variant,
        isDefault: member === ordered[0],
      })
    }
  }
  return { resolve: (slug) => index.get(slug) }
}
