import { createElement, forwardRef } from "react"
import type { ForwardRefExoticComponent, RefAttributes } from "react"
import type { AssetMeta } from "../types.ts"
import type { AssetSvgProps } from "./props.ts"

/** One renderable variant of a family: its viewBox and inner SVG markup. */
export interface SvgVariant {
  viewBox: string
  body: string
}

/** Props for a variant asset: the shared SVG props plus a `variant` selector. */
export type VariantSvgProps<K extends string> = AssetSvgProps & {
  /** Which variant to render. Defaults to the family's default variant when omitted. */
  variant?: K
}

/**
 * A generated inline-SVG component for a family of numbered variants (e.g. the two "noir
 * hog" illustrations). Renders the default variant with no prop and switches on
 * `variant="…"`. Carries the base `.meta` and the ordered `.variants` keys as statics.
 */
export interface VariantSvgAssetComponent<K extends string> extends ForwardRefExoticComponent<
  VariantSvgProps<K> & RefAttributes<SVGSVGElement>
> {
  meta: AssetMeta
  /** Available variant keys, in display order. */
  variants: readonly K[]
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

/**
 * Builds a variant-aware inline-`<svg>` component. Mirrors {@link createSvgAsset} but
 * selects one of several `{ viewBox, body }` payloads by the `variant` prop, falling back
 * to `defaultVariant` when the prop is omitted (or names an unknown variant).
 */
export function createVariantSvgAsset<K extends string>(opts: {
  variants: Record<K, SvgVariant>
  order: readonly K[]
  defaultVariant: K
  meta: AssetMeta
}): VariantSvgAssetComponent<K> {
  const { variants, order, defaultVariant, meta } = opts

  const Component = forwardRef<SVGSVGElement, VariantSvgProps<K>>(function BrandAsset(props, ref) {
    const { size, title, width, height, variant, ...rest } = props
    const chosen = (variant != null && variants[variant]) || variants[defaultVariant]
    const sizing =
      size != null
        ? { width: size }
        : width == null && height == null
          ? { width: "100%" }
          : { width, height }
    const inner = title ? `<title>${escapeXml(title)}</title>${chosen.body}` : chosen.body

    return createElement("svg", {
      ref,
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: chosen.viewBox,
      // See createSvgAsset: `body` has the root <svg> (which carries fill="none") stripped,
      // so reinstate it here or unfilled paths render as a black silhouette. Before
      // `...rest` so callers can still override.
      fill: "none",
      role: title ? "img" : undefined,
      "aria-hidden": title ? undefined : true,
      ...sizing,
      ...rest,
      dangerouslySetInnerHTML: { __html: inner },
    })
  }) as VariantSvgAssetComponent<K>

  Component.displayName = `Brand(${meta.namespace}/${meta.slug})`
  Component.meta = meta
  Component.variants = order
  return Component
}
