import { createElement, forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react"
import type { ForwardRefExoticComponent, MouseEvent, RefAttributes } from "react"
import { LOGO_HOLIDAY_ACCESSORIES, LOGO_VIEW_BOX, LOGOMARK_PARTS } from "./geometry.ts"
import type { LogomarkHandle, LogomarkProps } from "./types.ts"

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

// Animation constants mirroring the PostHog app's logomark jump (frontend/src/styles/base.scss
// + JumpingLogomark.tsx), so the mark bounces identically everywhere.
const JUMP_EASING = "cubic-bezier(0.6, 0, 0.2, 0.8)"
/** Per-part stagger, as a fraction of the airtime ("dividing by 15 just because it feels good"). */
const STAGGER_RATIO = 1 / 15
/** Height multiplier for the nth successive click — escalates, then cycles back down. */
const clickMagnitude = (iteration: number): number => 1.5 ** ((iteration % 8) - 2)

const prefersReducedMotion = (): boolean =>
  typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches

/**
 * The hedgehog logomark — the icon on its own. Static by default; opt it into the PostHog
 * app's jump by setting {@link LogomarkProps.jumpOnClick | `jumpOnClick`} (successive clicks
 * escalate the height) and/or {@link LogomarkProps.autoJumpMs | `autoJumpMs`}. See
 * {@link LogomarkProps} for the knobs (`jumpHeight`, `airtimeMs`).
 *
 * The mark always renders as 4 sibling groups (3 spikes + head). When it jumps, each group
 * springs up on a staggered vertical curve via the Web Animations API — no stylesheet
 * required. The head takes off first and the spikes follow right-to-left, matching the app.
 * Its `ref` is a {@link LogomarkHandle}: `ref.current.jump()` triggers a jump imperatively,
 * and `ref.current.svg` is the underlying `<svg>` node (for measuring, focusing, …).
 */
const LogomarkBase: ForwardRefExoticComponent<LogomarkProps & RefAttributes<LogomarkHandle>> =
  forwardRef<LogomarkHandle, LogomarkProps>(function Logomark(props, ref) {
    const {
      variant = "gradient",
      color,
      size,
      title,
      width,
      height,
      style,
      jumpOnClick = false,
      autoJumpMs,
      jumpHeight = 12,
      airtimeMs = 400,
      holiday,
      onClick,
      ...rest
    } = props

    // Our own handle on the <svg> to drive the animation. The public ref is a LogomarkHandle
    // (see useImperativeHandle below), not the node — the node hangs off `handle.svg`.
    const svgRef = useRef<SVGSVGElement | null>(null)

    const airborneUntil = useRef(0)
    const clickIteration = useRef(0)
    const canJump = jumpOnClick || autoJumpMs != null

    const jump = useCallback(
      (magnitude: number = 1): boolean => {
        const svg = svgRef.current
        if (!svg || typeof svg.animate !== "function" || prefersReducedMotion()) {
          return false
        }
        const now = performance.now()
        if (now < airborneUntil.current) {
          return false // Don't interrupt an in-flight jump.
        }
        // The declarative jump props set `overflow: visible` at render time; an imperative-only
        // jump (no jumpOnClick/autoJumpMs) has to opt in here, or the parts clip at the viewBox.
        svg.style.overflow = "visible"
        const parts = svg.querySelectorAll<SVGGElement>("[data-logo-part]")
        // Higher jumps stagger tighter, so the mark still reads as one hedgehog at magnitude 7.
        const stagger = (airtimeMs * STAGGER_RATIO) / Math.sqrt(magnitude)
        parts.forEach((part, index) => {
          part.animate(
            [
              { transform: "translateY(0)", easing: JUMP_EASING },
              { transform: `translateY(${-jumpHeight * magnitude}px)`, easing: JUMP_EASING },
              { transform: "translateY(0)" },
            ],
            // The head is the LAST group but jumps FIRST: delays grow towards the first group.
            { duration: airtimeMs, delay: stagger * (parts.length - index) },
          )
        })
        airborneUntil.current = now + airtimeMs
        return true
      },
      [airtimeMs, jumpHeight],
    )

    useImperativeHandle(
      ref,
      () => ({
        get svg(): SVGSVGElement | null {
          return svgRef.current
        },
        jump,
      }),
      [jump],
    )

    useEffect(() => {
      if (!autoJumpMs) {
        return
      }
      const id = setInterval(() => jump(), autoJumpMs)
      return () => clearInterval(id)
    }, [autoJumpMs, jump])

    const handleClick = (event: MouseEvent<SVGSVGElement>): void => {
      onClick?.(event)
      if (!jumpOnClick || event.defaultPrevented) {
        return
      }
      const next = clickIteration.current + 1
      if (jump(clickMagnitude(next))) {
        clickIteration.current = next
      }
    }

    const { blue, red, yellow, head, defs } = LOGOMARK_PARTS[variant]
    // A holiday accessory rides inside the head group, so it moves (and jumps) with the head.
    const accessory = holiday ? LOGO_HOLIDAY_ACCESSORIES[holiday] : ""
    const body =
      `<g data-logo-part="blue">${blue}</g>` +
      `<g data-logo-part="red">${red}</g>` +
      `<g data-logo-part="yellow">${yellow}</g>` +
      `<g data-logo-part="head">${head}${accessory}</g>` +
      defs
    const inner = title ? `<title>${escapeXml(title)}</title>${body}` : body

    const sizing =
      size != null
        ? { width: size }
        : width == null && height == null
          ? { width: "100%" }
          : { width, height }

    return createElement("svg", {
      ref: svgRef,
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: LOGO_VIEW_BOX.logomark,
      role: title ? "img" : undefined,
      "aria-hidden": title ? undefined : true,
      ...sizing,
      style: {
        // Parts leave the viewBox mid-jump, and a holiday hat pokes past the head's
        // silhouette — either way, don't clip at the viewBox edge. A plain static logomark
        // has nothing outside its box, so it clips as usual.
        ...(canJump || holiday != null ? { overflow: "visible" as const } : null),
        ...(jumpOnClick ? { cursor: "pointer", userSelect: "none" as const } : null),
        ...(variant === "mono" && color != null ? { color } : null),
        ...style,
      },
      onClick: handleClick,
      ...rest,
      dangerouslySetInnerHTML: { __html: inner },
    })
  })

LogomarkBase.displayName = "Logo.Logomark"

export const Logomark: ForwardRefExoticComponent<LogomarkProps & RefAttributes<LogomarkHandle>> =
  LogomarkBase
