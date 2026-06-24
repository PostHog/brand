import { createElement, forwardRef } from "react"
import type { ForwardRefExoticComponent, RefAttributes } from "react"
import type { AssetMeta } from "../types.ts"
import type { AssetSvgProps } from "./props.ts"

/** A generated inline-SVG component, carrying its metadata as a static `.meta`. */
export interface SvgAssetComponent extends ForwardRefExoticComponent<
  AssetSvgProps & RefAttributes<SVGSVGElement>
> {
  meta: AssetMeta
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

/**
 * Builds a React component that renders an inline `<svg>`. The optimized markup is
 * injected as a string (cheaper than transpiling thousands of path nodes to JSX, and
 * the exact same payload backs the `/<namespace>/svg` string export).
 */
export function createSvgAsset(opts: {
  viewBox: string
  body: string
  meta: AssetMeta
}): SvgAssetComponent {
  const { viewBox, body, meta } = opts

  const Component = forwardRef<SVGSVGElement, AssetSvgProps>(function BrandAsset(props, ref) {
    const { size, title, width, height, ...rest } = props
    const sizing =
      size != null
        ? { width: size }
        : width == null && height == null
          ? { width: "100%" }
          : { width, height }
    const inner = title ? `<title>${escapeXml(title)}</title>${body}` : body

    return createElement("svg", {
      ref,
      xmlns: "http://www.w3.org/2000/svg",
      viewBox,
      // Every source SVG carries `fill="none"` on its root <svg>; `body` is the inner
      // markup with that root tag stripped, so we must reinstate it here. Without it,
      // any path that omits its own `fill` inherits the SVG default (black) and the
      // whole asset renders as a black silhouette. Placed before `...rest` so callers
      // can still override the fill.
      fill: "none",
      role: title ? "img" : undefined,
      "aria-hidden": title ? undefined : true,
      ...sizing,
      ...rest,
      dangerouslySetInnerHTML: { __html: inner },
    })
  }) as SvgAssetComponent

  Component.displayName = `Brand(${meta.namespace}/${meta.slug})`
  Component.meta = meta
  return Component
}
