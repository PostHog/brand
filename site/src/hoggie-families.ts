// Hoggies grouped the way the package exports them: a numbered variant family (`noir-1` …
// `noir-5`) is ONE component taking a `variant` prop, with its members in the package's
// `getVariants` order — so the site shows it as one page and the catalog lists it as one entry.
// Shared by the hoggie detail page and the agent catalog (agent/data.ts), so both write the
// same JSX.

import { findAssets, getComponentName, getVariants, type AssetMeta } from "@posthog/brand"

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

/** Every hoggie family, by slug, in catalog order. */
export function hoggieFamilies(): Map<string, HoggieFamily> {
  const families = new Map<string, HoggieFamily>()
  for (const { slug, name } of findAssets({ namespace: "hoggies" })) {
    if (families.has(slug)) continue
    const members = getVariants("hoggies", slug)
    families.set(slug, {
      slug,
      name,
      component: getComponentName("hoggies", slug),
      members,
      tags: [...new Set(members.flatMap((member) => member.tags ?? []))],
    })
  }
  return families
}
