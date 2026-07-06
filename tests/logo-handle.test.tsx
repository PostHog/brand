// @vitest-environment jsdom
//
// The <Logo.Logomark> imperative handle needs a real DOM (refs + effects only run on the
// client), so this file opts into jsdom via the pragma above — the rest of the logo suite
// stays on the node/server-render path. jsdom has no Web Animations API, so we stub
// `Element.prototype.animate` to exercise the jump path.

import { createElement, createRef } from "react"
import { act } from "react"
import { createRoot } from "react-dom/client"
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import { Logo } from "../src/logo/index.ts"
import type { LogomarkHandle } from "../src/logo/index.ts"

const originalAnimate = Element.prototype.animate
const animate = vi.fn((_keyframes?: unknown, _options?: unknown) => ({}) as Animation)

beforeAll(() => {
  // jsdom doesn't implement the Web Animations API; the jump probes `svg.animate` for support
  // and then calls `part.animate` on each group.
  Element.prototype.animate = animate as unknown as typeof Element.prototype.animate
})
afterAll(() => {
  Element.prototype.animate = originalAnimate
})
afterEach(() => {
  animate.mockClear()
})

function mount(props?: Record<string, unknown>): {
  ref: { current: LogomarkHandle | null }
  container: HTMLElement
  unmount: () => void
} {
  const ref = createRef<LogomarkHandle>()
  const container = document.createElement("div")
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => {
    root.render(createElement(Logo.Logomark, { ...props, ref }))
  })
  return {
    ref,
    container,
    unmount: () => {
      act(() => root.unmount())
      container.remove()
    },
  }
}

describe("<Logo.Logomark> imperative handle", () => {
  it("exposes the <svg> node and a jump() method on the ref", () => {
    const { ref, container, unmount } = mount()
    expect(ref.current).not.toBeNull()
    expect(ref.current!.svg).toBe(container.querySelector("svg"))
    expect(typeof ref.current!.jump).toBe("function")
    unmount()
  })

  it("jumps programmatically without jumpOnClick / autoJumpMs", () => {
    const { ref, unmount } = mount()
    // jump() drives the DOM directly (no React state), so it needs no act() wrapper.
    expect(ref.current!.jump()).toBe(true)
    // One animation per part — the 3 spikes + the head.
    expect(animate).toHaveBeenCalledTimes(4)
    unmount()
  })

  it("un-clips the box so the jump is visible even when opted in only via the handle", () => {
    const { ref, container, unmount } = mount()
    expect(container.querySelector("svg")!.style.overflow).toBe("")
    ref.current!.jump()
    expect(container.querySelector("svg")!.style.overflow).toBe("visible")
    unmount()
  })

  it("scales the height with the magnitude argument", () => {
    const { ref, unmount } = mount({ jumpHeight: 10 })
    ref.current!.jump(3)
    const keyframes = animate.mock.calls[0]?.[0] as Array<{ transform: string }>
    expect(keyframes[1]?.transform).toBe("translateY(-30px)") // 10 * 3
    unmount()
  })

  it("won't interrupt an in-flight jump", () => {
    const { ref, unmount } = mount()
    expect(ref.current!.jump()).toBe(true)
    animate.mockClear()
    expect(ref.current!.jump()).toBe(false) // still airborne
    expect(animate).not.toHaveBeenCalled()
    unmount()
  })
})
