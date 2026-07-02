import { describe, expect, it } from "vitest"
import { fontFaceCss, roundHog, roundHogFaces, roundHogFontFaceCss } from "../src/fonts/index.ts"

describe("roundHog font", () => {
  it("is the RoundHog family with eight faces", () => {
    expect(roundHog.family).toBe("RoundHog")
    expect(roundHog.faces).toBe(roundHogFaces)
    expect(roundHogFaces).toHaveLength(8)
  })

  it("covers every weight in both upright and italic", () => {
    const key = (w: number, s: string): string => `${w}/${s}`
    const got = new Set(roundHogFaces.map((f) => key(f.weight, f.style)))
    const want = [400, 500, 700, 800].flatMap((w) => [key(w, "normal"), key(w, "italic")])
    for (const k of want) expect(got).toContain(k)
    expect(got.size).toBe(8)
  })

  it("points every face at a bundled woff2 URL", () => {
    for (const face of roundHogFaces) {
      expect(face.format).toBe("woff2")
      expect(face.url).toMatch(/RoundHog[\w-]*\.woff2$/)
    }
    // URLs are unique per face — no two weights share a file.
    expect(new Set(roundHogFaces.map((f) => f.url)).size).toBe(8)
  })
})

describe("fontFaceCss", () => {
  it("emits one @font-face per face with swap + format", () => {
    const css = roundHogFontFaceCss
    expect(css).toBe(fontFaceCss(roundHog))
    expect(css.match(/@font-face/g)).toHaveLength(8)
    expect(css).toContain('font-family: "RoundHog";')
    expect(css).toContain("font-display: swap;")
    expect(css).toContain('format("woff2")')
    expect(css).toContain("font-weight: 400;")
    expect(css).toContain("font-weight: 800;")
    expect(css).toContain("font-style: italic;")
  })
})
