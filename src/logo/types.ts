// Public prop/type surface for the <Logo> component. React-free types only.

import type { AssetSvgProps } from "../runtime/props.ts"

/**
 * Color treatment of the mark, passed as {@link LogoProps.variant}.
 *
 * - `"gradient"` — the full multi-color brand gradient. The default.
 * - `"print"` — the flat 4-color / CMYK separation, for print and limited-palette use.
 * - `"mono"` — a single solid color (see {@link LogoProps.color}), e.g. all-white on a dark
 *   background or all-black on a light one.
 *
 * @example
 * ```tsx
 * <Logo variant="gradient" />              // full color (default)
 * <Logo variant="print" />                 // 4-color / CMYK
 * <Logo variant="mono" color="#fff" />     // single color
 * ```
 */
export type LogoVariant = "gradient" | "mono" | "print"

/**
 * Which form of the lockup to render, passed as {@link LogoProps.layout}.
 *
 * - `"landscape"` — logomark + wordmark, side by side. The default.
 * - `"stacked"` — logomark above the wordmark (portrait).
 * - `"logomark"` — the hedgehog icon only (also {@link Logo.Logomark}).
 * - `"wordmark"` — the "PostHog" wordmark only (also {@link Logo.Wordmark}).
 *
 * @example
 * ```tsx
 * <Logo layout="landscape" />   // ▱ PostHog   (default)
 * <Logo layout="stacked" />     // ▱ over PostHog
 * <Logo layout="logomark" />    // ▱
 * <Logo layout="wordmark" />    // PostHog
 * ```
 */
export type LogoLayout = "landscape" | "stacked" | "logomark" | "wordmark"

/**
 * Props for the {@link Logo} component. Extends every native `<svg>` prop (plus `size` and
 * `title` from {@link AssetSvgProps}), so `className`, `style`, `onClick`, `ref`, … all work.
 *
 * @example
 * ```tsx
 * import { Logo } from "@posthog/brand/logo"
 *
 * <Logo />                                   // landscape, full gradient
 * <Logo size={160} />                        // 160px wide, height auto from aspect ratio
 * <Logo variant="mono" color="#fff" />       // single color
 * <Logo variant="print" layout="stacked" />  // 4-color, portrait lockup
 * <Logo title="PostHog" />                   // labelled for assistive tech
 * ```
 */
export interface LogoProps extends AssetSvgProps {
  /**
   * Color treatment — see {@link LogoVariant}.
   *
   * @default "gradient"
   */
  variant?: LogoVariant
  /**
   * Lockup form — see {@link LogoLayout}.
   *
   * @default "landscape"
   */
  layout?: LogoLayout
  /**
   * The fill for `variant="mono"` (and the always-mono `wordmark` layout). Any CSS color,
   * e.g. `"#fff"`, `"black"`, or a token like `colors.blue.core`. **Ignored** by the
   * `gradient` and `print` variants. When omitted the mark inherits the ambient CSS `color`
   * (`currentColor`), so it adapts to its surroundings by default.
   *
   * @default "currentColor"
   * @example
   * ```tsx
   * <Logo variant="mono" color="#fff" />          // explicit white
   * <Logo variant="mono" />                        // inherits surrounding text color
   * <span style={{ color: "red" }}><Logo variant="mono" /></span>  // red
   * ```
   */
  color?: string
}

/**
 * Props for {@link Logo.Logomark} — a {@link Logo} pinned to `layout="logomark"` (the
 * hedgehog icon only). Same as {@link LogoProps} without `layout`.
 *
 * @example
 * ```tsx
 * <Logo.Logomark size={32} />
 * <Logo.Logomark variant="mono" color="#fff" />
 * ```
 */
export type LogomarkProps = Omit<LogoProps, "layout">

/**
 * Props for {@link Logo.Wordmark} — a {@link Logo} pinned to `layout="wordmark"` (the
 * "PostHog" wordmark only). The wordmark is always mono, so `layout` and `variant` are
 * omitted; use `color` to tint it.
 *
 * @example
 * ```tsx
 * <Logo.Wordmark />                  // inherits the surrounding text color
 * <Logo.Wordmark color="#fff" />     // white wordmark
 * ```
 */
export type WordmarkProps = Omit<LogoProps, "layout" | "variant">
