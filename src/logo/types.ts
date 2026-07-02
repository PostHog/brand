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
 * Props for {@link Logo.Logomark} — the hedgehog icon on its own (a {@link Logo} without
 * `layout`). Static by default; it can also **jump** like the logomark in the PostHog app —
 * its 3 spikes and head spring up one after the other. Opt in with {@link jumpOnClick}
 * and/or {@link autoJumpMs}; tune it with {@link jumpHeight} / {@link airtimeMs}. Every
 * native `<svg>` prop (`className`, `style`, `onClick`, `ref` → the `<svg>`, …) works too.
 *
 * Jumping respects `prefers-reduced-motion` (jumps become no-ops).
 *
 * @example
 * ```tsx
 * <Logo.Logomark size={32} />                              // static icon
 * <Logo.Logomark variant="mono" color="#fff" />            // single color
 * <Logo.Logomark jumpOnClick />                            // click me! (clicks escalate)
 * <Logo.Logomark autoJumpMs={3000} />                      // jumps every 3s
 * ```
 */
export interface LogomarkProps extends Omit<LogoProps, "layout"> {
  /**
   * Jump when clicked. Rapid successive clicks escalate the height along the same curve as
   * the PostHog app (`1.5 ** ((n % 8) - 2)` — builds up, then cycles back down).
   *
   * @default false
   */
  jumpOnClick?: boolean
  /**
   * Jump automatically every this-many milliseconds (e.g. `5000` for every 5s). Omit for
   * no auto-jumping.
   */
  autoJumpMs?: number
  /**
   * Baseline jump height, in viewBox units (the mark is 28 tall, so the default `12` is a
   * bit under half its height). Scales with the rendered size, and is multiplied by the
   * per-jump magnitude of the click escalation.
   *
   * @default 12
   */
  jumpHeight?: number
  /**
   * Duration of one jump (up and back down) in milliseconds. The spike stagger is derived
   * from it, so shortening the airtime tightens the whole animation.
   *
   * @default 400
   */
  airtimeMs?: number
}

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
