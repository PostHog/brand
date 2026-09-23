// Resolve a crest's *bundled PNG* (URL + blurred placeholder) from its slug + tier — the
// dogfooding bit.
//
// Like the hoggies grid, the crests grid renders PNG thumbnails (fixed-height, lazily
// loaded) rather than inline-SVG components, so the route stays light and the browser
// fetches only the images in view. We namespace-import the real per-tier PNG barrels and
// look each URL up by its generated export name, so the grid shows exactly what
// `@posthog/brand/crests/{full,mini}/png` consumers get. The matching blurred placeholder
// comes from `virtual:brand-lqip/*` (see site/lqip-plugin.ts), keyed by the same export
// name. Imported only by the crest routes, so these barrels stay out of the initial bundle.

import { getComponentName, type CrestTier } from "@posthog/brand"
import * as FullPng from "@posthog/brand/crests/full/png"
import * as MiniPng from "@posthog/brand/crests/mini/png"
import fullLqip from "virtual:brand-lqip/crests-full"
import miniLqip from "virtual:brand-lqip/crests-mini"
import fullSvg from "virtual:brand-svg/crests-full"
import miniSvg from "virtual:brand-svg/crests-mini"
import type { AssetImage, SvgLoader } from "./assets-hoggies.ts"

const full = FullPng as unknown as Record<string, string>
const mini = MiniPng as unknown as Record<string, string>

const lowerFirst = (s: string): string => s.charAt(0).toLowerCase() + s.slice(1)

/**
 * The bundled PNG for a crest by slug and tier, e.g. ("array", "full") → `arrayCrestPng`,
 * ("array", "mini") → `arrayCrestMiniPng`. `src` is `undefined` for the mini tier of a
 * crest that has no mini.
 */
export function crestPng(slug: string, tier: CrestTier): AssetImage {
  const png = tier === "mini" ? mini : full
  const lqip = tier === "mini" ? miniLqip : fullLqip
  const key = `${lowerFirst(getComponentName("crests", slug, tier))}Png`
  return { src: png[key], placeholder: lqip[key] }
}

/** A loader for a crest's SVG string by slug and tier (rejects for a missing mini). */
export function crestSvg(slug: string, tier: CrestTier): SvgLoader {
  const loaders = tier === "mini" ? miniSvg : fullSvg
  return loaders[slug] ?? (() => Promise.reject(new Error(`No ${tier} SVG for ${slug}`)))
}
