import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { cutSubsets, splitCodepoints, toUnicodeRange } from "../scripts/lib/fonts.ts"
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
  it("emits one @font-face per subset of each face, with swap + format", () => {
    const css = roundHogFontFaceCss
    expect(css).toBe(fontFaceCss(roundHog))
    const subsets = roundHogFaces.flatMap((f) => f.subsets)
    expect(css.match(/@font-face/g)).toHaveLength(subsets.length)
    expect(css.match(/unicode-range: /g)).toHaveLength(subsets.length)
    for (const face of roundHogFaces) expect(css).not.toContain(`url("${face.url}")`)
    expect(css).toContain('font-family: "RoundHog";')
    expect(css).toContain("font-display: swap;")
    expect(css).toContain('format("woff2")')
    expect(css).toContain("font-weight: 400;")
    expect(css).toContain("font-weight: 800;")
    expect(css).toContain("font-style: italic;")
  })

  it("emits the full face for a face without subsets", () => {
    const css = fontFaceCss({
      family: "Custom",
      faces: [{ weight: 400, style: "normal", url: "custom.woff2", format: "woff2" }],
    })
    expect(css.match(/@font-face/g)).toHaveLength(1)
    expect(css).toContain('url("custom.woff2")')
    expect(css).not.toContain("unicode-range")
  })
})

describe("roundHog subsets", () => {
  const fontsDir = join(import.meta.dirname, "..", "assets", "fonts")
  const fileOf = (url: string): string => fileURLToPath(url).split("/src/fonts/").at(-1) ?? ""
  const read = (url: string): Buffer => readFileSync(join(fontsDir, fileOf(url)))

  it.each(roundHogFaces.map((f) => [`${f.weight}/${f.style}`, f] as const))(
    "%s ships the current subsets of its own full face, with their exact ranges",
    async (_, face) => {
      const fresh = await cutSubsets(read(face.url))
      expect(face.subsets.map((s) => [s.name, s.unicodeRange])).toEqual(
        fresh.map((s) => [s.name, toUnicodeRange(s.codepoints)]),
      )
      for (const [i, subset] of face.subsets.entries())
        expect(read(subset.url).equals(fresh[i]?.woff2 ?? Buffer.alloc(0))).toBe(true)
    },
  )
})

describe("splitCodepoints", () => {
  it("puts each codepoint in one subset, with everything unlisted in rest", () => {
    // A, é, Ā, α, Ж, ⌘, and a private-use glyph.
    const subsets = splitCodepoints([0x41, 0xe9, 0x100, 0x3b1, 0x416, 0x2318, 0xe000])
    expect(Object.fromEntries(subsets)).toEqual({
      latin: [0x41, 0xe9, 0x2318],
      "latin-ext": [0x100],
      greek: [0x3b1],
      cyrillic: [0x416],
      rest: [0xe000],
    })
  })

  it("leaves out empty subsets", () => {
    expect([...splitCodepoints([0x41]).keys()]).toEqual(["latin"])
  })
})

describe("toUnicodeRange", () => {
  it.each([
    ["a single codepoint", [0x41], "U+41"],
    ["a run", [0x41, 0x42, 0x43], "U+41-43"],
    [
      "runs and gaps, unsorted with repeats",
      [0xa0, 0x20, 0x21, 0x22, 0x20, 0x2122],
      "U+20-22, U+A0, U+2122",
    ],
    ["nothing", [], ""],
  ])("collapses %s", (_, codepoints, expected) => {
    expect(toUnicodeRange(codepoints)).toBe(expected)
  })
})
