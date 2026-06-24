// Shared prop types for the generated components. Imported only by the React
// component entry points, so `/<namespace>/svg` (strings), `/<namespace>/png`
// (urls), and `/<namespace>/metadata` stay React-free.

import type { ComponentPropsWithoutRef } from "react"

interface CommonAssetProps {
  /**
   * Convenience sizing: sets the rendered width. Height follows from the
   * illustration's intrinsic aspect ratio. Accepts a number (px) or any CSS length.
   */
  size?: number | string
  /**
   * Accessible label. When provided the image is announced to assistive tech
   * (via an SVG `<title>`); when omitted the image is treated as decorative.
   */
  title?: string
}

/** Props for an inline-SVG asset component (renders an `<svg>`). */
export type AssetSvgProps = Omit<ComponentPropsWithoutRef<"svg">, "title"> & CommonAssetProps

/** The common prop surface; accepts `size`, `title`, `className`, `style`, … */
export type AssetProps = AssetSvgProps
