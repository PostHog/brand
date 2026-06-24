// @posthog/brand — PostHog's brand assets as a bundled, offline, tree-shakeable library.
//
// The root entry is metadata-only: types, the full asset manifest, and search helpers.
// It pulls in NO React and NO image payload. Import components and assets from a
// namespace subpath, which tree-shakes down to only what you reference:
//
//   import { HedgehogDoctorHog } from "@posthog/brand/hoggies";
//   import { Logo } from "@posthog/brand/logo";                  // <Logo />, <Logo.Logomark />, …
//   import { ArrayCrest } from "@posthog/brand/crests";          // <ArrayCrest /> + <ArrayCrest.Mini />
//   import { ArrayCrest } from "@posthog/brand/crests/full";
//   import { ArrayCrestMini } from "@posthog/brand/crests/mini";
//   import doctorHogSvg from "@posthog/brand/hoggies/svg/doctor-hog";
//   import doctorHogPng from "@posthog/brand/hoggies/png/doctor-hog";
//   import { colors } from "@posthog/brand/colors";

import { componentName } from "./naming.ts"
import type { CrestTier, Namespace } from "./types.ts"

export { NAMESPACES, CREST_TIERS } from "./types.ts"
export type { AssetMeta, Namespace, CrestTier, BrandColor, BrandColors } from "./types.ts"

// Component factory's public type + shared props.
export type { SvgAssetComponent } from "./runtime/create-svg-asset.tsx"
export type { AssetProps, AssetSvgProps } from "./runtime/props.ts"

// Cross-namespace manifest + search (React-free, zero image payload).
export { allAssets } from "./generated/manifest.ts"
export { findAssets, getAsset, type FindAssetsFilter } from "./search.ts"

/**
 * The generated React component name for an asset, e.g. ("hoggies","doctor-hog") →
 * "HedgehogDoctorHog". For crest minis pass `tier` for the trailing "Mini":
 * ("crests","array","mini") → "ArrayCrestMini".
 */
export function getComponentName(namespace: Namespace, slug: string, tier?: CrestTier): string {
  return componentName(namespace, slug, tier)
}
