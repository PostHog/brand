// Framework-agnostic font types. No React import — the `/fonts` and `/fonts/css`
// entry points are plain data (URLs + a CSS string) and pull in zero React.

/** A CSS `font-style`. RoundHog ships upright and italic faces. */
export type FontStyle = "normal" | "italic"

/**
 * One shippable font face: a single weight/style pointing at a bundled woff2.
 * `weight` is the CSS `font-weight` the face should register under (PostHog maps
 * SemiBold→700 and Bold→800, matching the app's type scale).
 */
export interface FontFace {
  /** CSS `font-weight` this face registers under, e.g. 400, 500, 700, 800. */
  weight: number
  /** CSS `font-style` this face registers under. */
  style: FontStyle
  /**
   * Absolute URL of the woff2 file, resolved against this module via
   * `new URL(..., import.meta.url)` — the same asset resolution the PNGs use, so
   * any ESM-aware bundler (webpack 5, Vite, esbuild, Rollup) emits/rewrites it.
   */
  url: string
  /** Font format token for the `@font-face` `src`. Always "woff2" here. */
  format: "woff2"
}

/** A bundled font family: its CSS `font-family` name and every face it ships. */
export interface FontFamily {
  /** The value to use in CSS `font-family`, e.g. "RoundHog". */
  family: string
  /** Every face, in weight-then-style order. */
  faces: readonly FontFace[]
}
