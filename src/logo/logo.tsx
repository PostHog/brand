import { createElement, forwardRef } from "react"
import type { ForwardRefExoticComponent, RefAttributes } from "react"
import { LOGO_BODY, LOGO_VIEW_BOX } from "./geometry.ts"
import type { LogoProps, LogomarkProps, WordmarkProps } from "./types.ts"

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

/**
 * The PostHog logo as one parametric inline-SVG component. `layout` picks the lockup
 * form, `variant` the color treatment, and `color` the fill for `mono`. Markup is
 * injected as a string (cheaper than transpiling the path nodes to JSX). Forwards a ref
 * to the underlying `<svg>` and spreads any extra svg props (`className`, `style`, …).
 */
const LogoBase: ForwardRefExoticComponent<LogoProps & RefAttributes<SVGSVGElement>> = forwardRef<
  SVGSVGElement,
  LogoProps
>(function Logo(props, ref) {
  const {
    variant = "gradient",
    layout = "landscape",
    color,
    size,
    title,
    width,
    height,
    style,
    ...rest
  } = props

  const body = LOGO_BODY[layout][variant]
  const viewBox = LOGO_VIEW_BOX[layout]

  const sizing =
    size != null
      ? { width: size }
      : width == null && height == null
        ? { width: "100%" }
        : { width, height }

  // `mono` and the (always-mono) wordmark draw with `currentColor`; the `color` prop, when
  // given, sets it via the element's CSS color. gradient/print ignore `color`.
  const usesCurrentColor = variant === "mono" || layout === "wordmark"
  const mergedStyle = usesCurrentColor && color != null ? { color, ...style } : style

  const inner = title ? `<title>${escapeXml(title)}</title>${body}` : body

  return createElement("svg", {
    ref,
    xmlns: "http://www.w3.org/2000/svg",
    viewBox,
    role: title ? "img" : undefined,
    "aria-hidden": title ? undefined : true,
    ...sizing,
    style: mergedStyle,
    ...rest,
    dangerouslySetInnerHTML: { __html: inner },
  })
})

LogoBase.displayName = "Logo"

const Logomark: ForwardRefExoticComponent<LogomarkProps & RefAttributes<SVGSVGElement>> =
  forwardRef<SVGSVGElement, LogomarkProps>(function Logomark(props, ref) {
    return createElement(LogoBase, { ...props, ref, layout: "logomark" })
  })
Logomark.displayName = "Logo.Logomark"

const Wordmark: ForwardRefExoticComponent<WordmarkProps & RefAttributes<SVGSVGElement>> =
  forwardRef<SVGSVGElement, WordmarkProps>(function Wordmark(props, ref) {
    return createElement(LogoBase, { ...props, ref, layout: "wordmark" })
  })
Wordmark.displayName = "Logo.Wordmark"

/** The {@link Logo} component, with `Logomark` / `Wordmark` shorthands attached. */
export interface LogoComponent extends ForwardRefExoticComponent<
  LogoProps & RefAttributes<SVGSVGElement>
> {
  /**
   * The hedgehog icon only — shorthand for `<Logo layout="logomark">`. See {@link LogomarkProps}.
   *
   * @example
   * ```tsx
   * <Logo.Logomark size={32} />
   * <Logo.Logomark variant="mono" color="#fff" />
   * ```
   */
  Logomark: ForwardRefExoticComponent<LogomarkProps & RefAttributes<SVGSVGElement>>
  /**
   * The "PostHog" wordmark only — shorthand for `<Logo layout="wordmark">`. Always mono;
   * tint it with `color`. See {@link WordmarkProps}.
   *
   * @example
   * ```tsx
   * <Logo.Wordmark />
   * <Logo.Wordmark color="#fff" />
   * ```
   */
  Wordmark: ForwardRefExoticComponent<WordmarkProps & RefAttributes<SVGSVGElement>>
}

/**
 * The PostHog logo — one component for every lockup and color treatment.
 *
 * Pick the **form** with {@link LogoProps.layout | `layout`} (`landscape` · `stacked` ·
 * `logomark` · `wordmark`) and the **color treatment** with {@link LogoProps.variant |
 * `variant`} (`gradient` · `print` · `mono`). For `mono`, set {@link LogoProps.color |
 * `color`} to any CSS color — it defaults to `currentColor`, so the mark inherits the
 * surrounding text color. Renders an inline `<svg>`: it scales crisply, takes every native
 * `<svg>` prop (`className`, `style`, `onClick`, …), and forwards `ref` to the element.
 *
 * Sizing: pass `size` (a number of px or any CSS length) to set the width — height follows
 * the lockup's aspect ratio. Accessibility: pass `title` to label it for assistive tech
 * (`role="img"` + `<title>`); without one it renders as decorative (`aria-hidden`).
 *
 * Shorthands {@link LogoComponent.Logomark | `Logo.Logomark`} and
 * {@link LogoComponent.Wordmark | `Logo.Wordmark`} render just the icon or just the wordmark.
 *
 * @example
 * ```tsx
 * import { Logo } from "@posthog/brand/logo"
 *
 * <Logo />                                    // landscape lockup, full gradient (defaults)
 * <Logo size={160} title="PostHog" />         // 160px wide, labelled
 * <Logo variant="mono" color="#fff" />        // single color (e.g. on a dark background)
 * <Logo variant="mono" />                     // inherits the ambient CSS `color`
 * <Logo variant="print" layout="stacked" />   // 4-color / CMYK, portrait lockup
 * <Logo.Logomark size={32} />                 // the hedgehog icon only
 * <Logo.Wordmark />                           // the "PostHog" wordmark only
 * ```
 *
 * @see {@link LogoProps} for the full prop reference.
 */
export const Logo: LogoComponent = Object.assign(LogoBase, { Logomark, Wordmark })
