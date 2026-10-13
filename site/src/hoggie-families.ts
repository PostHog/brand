// Hoggies grouped the way the package exports them: a numbered variant family (`noir-1` …
// `noir-5`) is ONE component taking a `variant` prop, so the site shows it as one page and the
// catalog lists it as one entry. Shared by the hoggie detail page and the agent catalog
// (agent/data.ts), so both order members and write their JSX the same way.

import { findAssets, getComponentName, type AssetMeta } from "@posthog/brand"

export interface HoggieFamily {
  slug: string
  name: string
  /** React component name, shared by every member. */
  component: string
  /** Members in variant order; a standalone hoggie is a family of one, with no `variant`. */
  members: AssetMeta[]
  /** Every member's tags, de-duplicated. */
  tags: string[]
}

/** JSX rendering one member, e.g. `<HedgehogNoir variant="5" />`. */
export function hoggieJsx(component: string, variant?: string): string {
  return variant ? `<${component} variant="${variant}" />` : `<${component} />`
}

/** Every hoggie family, by slug. */
export function hoggieFamilies(): Map<string, HoggieFamily> {
  const families = new Map<string, HoggieFamily>()
  for (const asset of findAssets({ namespace: "hoggies" })) {
    const family = families.get(asset.slug)
    if (family) family.members.push(asset)
    else {
      families.set(asset.slug, {
        slug: asset.slug,
        name: asset.name,
        component: getComponentName("hoggies", asset.slug),
        members: [asset],
        tags: [],
      })
    }
  }
  for (const family of families.values()) {
    family.members.sort((a, b) => Number(a.variant?.variant ?? 0) - Number(b.variant?.variant ?? 0))
    family.tags = [...new Set(family.members.flatMap((member) => member.tags ?? []))]
  }
  return families
}
