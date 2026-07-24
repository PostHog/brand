// Resolve a hoggie's *bundled PNG* (URL + blurred placeholder) from its slug — the
// dogfooding bit.
//
// The catalog grid renders PNG thumbnails (fixed-height, lazily loaded), so it stays
// light: the package's PNG exports are just URL strings pointing at files Vite emits
// next to the bundle, and the browser fetches only the images actually scrolled into
// view. We namespace-import the real PNG barrel and look each URL up by its generated
// export name, so the grid still shows exactly what `@posthog/brand/hoggies/png`
// consumers get. The matching blurred placeholder comes from `virtual:brand-lqip/*`
// (see site/lqip-plugin.ts), keyed by the same export name. Imported only by the
// Hoggies route, so this barrel stays out of the initial bundle.

import { getComponentName } from "@posthog/brand"
import * as HoggiesPng from "@posthog/brand/hoggies/png"
import lqip from "virtual:brand-lqip/hoggies"

const png = HoggiesPng as unknown as Record<string, string>

const lowerFirst = (s: string): string => s.charAt(0).toLowerCase() + s.slice(1)

/** A resolved thumbnail: its full-size PNG URL and a tiny blurred placeholder data URI. */
export interface AssetImage {
  src?: string
  placeholder?: string
}

/**
 * The bundled PNG for a hoggie, e.g. "chart" → `hedgehogChartPng`. Numbered
 * variant families share a family slug; pass the `variant` to reach the member's own PNG
 * (e.g. "construction" + "1" → `hedgehogConstruction1Png`).
 */
export function hoggiePng(slug: string, variant?: string): AssetImage {
  const moduleSlug = variant ? `${slug}-${variant}` : slug
  const key = `${lowerFirst(getComponentName("hoggies", moduleSlug))}Png`
  return { src: png[key], placeholder: lqip[key] }
}
