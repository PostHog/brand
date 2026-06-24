import { describe, expect, it } from "vitest"
import { optimizeSvg, svgBody } from "../scripts/lib/svg.ts"

const WITH_VIEWBOX = `<svg width="100" height="50" viewBox="0 0 100 50" xmlns="http://www.w3.org/2000/svg"><rect id="r" width="100" height="50" fill="#f00"/></svg>`

// A traced-style SVG: width/height but no viewBox, plus a clip id that would
// collide across assets if left un-prefixed.
const NO_VIEWBOX = `<svg width="200" height="100" xmlns="http://www.w3.org/2000/svg"><clipPath id="clip0_1_2"><rect width="200" height="100"/></clipPath><g clip-path="url(#clip0_1_2)"><path d="M1.123456 2.987654L3 4Z" fill="#00ff00"/></g></svg>`

describe("optimizeSvg", () => {
  it("preserves an existing viewBox and drops width/height", () => {
    const o = optimizeSvg(WITH_VIEWBOX, "demo")
    expect(o.viewBox).toBe("0 0 100 50")
    expect(o.aspectRatio).toBeCloseTo(2)
    expect(o.svg).not.toMatch(/<svg[^>]*\bwidth=/)
    expect(o.svg).not.toMatch(/<svg[^>]*\bheight=/)
  })

  it("synthesizes a viewBox from width/height when missing", () => {
    const o = optimizeSvg(NO_VIEWBOX, "traced")
    expect(o.viewBox).toBe("0 0 200 100")
    expect(o.aspectRatio).toBeCloseTo(2)
  })

  it("prefixes ids with the given prefix so inlined assets never collide", () => {
    const o = optimizeSvg(NO_VIEWBOX, "hoggies-traced")
    const ids = [...o.svg.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1])
    expect(ids.length).toBeGreaterThan(0)
    expect(ids.every((id) => id?.startsWith("hoggies-traced-"))).toBe(true)

    // The reference is rewritten to match the prefixed id.
    expect(o.svg).toMatch(/url\(#hoggies-traced-/)
  })

  it("reduces numeric precision", () => {
    const o = optimizeSvg(NO_VIEWBOX, "traced")
    expect(o.svg).not.toContain("1.123456")
  })

  it("throws when there is no way to determine dimensions", () => {
    expect(() => optimizeSvg(`<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>`, "x")).toThrow(
      /viewBox|width/i,
    )
  })
})

describe("svgBody", () => {
  it("extracts inner markup without the wrapper", () => {
    const o = optimizeSvg(WITH_VIEWBOX, "demo")
    const body = svgBody(o.svg)
    expect(body).not.toContain("<svg")
    expect(body).not.toContain("</svg>")

    // SVGO may convert <rect> to a <path>; either way the shape survives.
    expect(body).toMatch(/<(rect|path)\b/)
  })
})
