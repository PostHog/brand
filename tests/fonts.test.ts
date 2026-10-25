import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import {
  LATIN_TARGET_RANGES,
  codepointsInRanges,
  fontCodepoints,
  latinSubset,
  toUnicodeRange,
} from "../scripts/lib/fonts.ts"
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
  it("emits a full and a Latin @font-face per face with swap + format", () => {
    const css = roundHogFontFaceCss
    expect(css).toBe(fontFaceCss(roundHog))
    expect(css.match(/@font-face/g)).toHaveLength(16)
    expect(css.match(/unicode-range: /g)).toHaveLength(8)
    expect(css).toContain('font-family: "RoundHog";')
    expect(css).toContain("font-display: swap;")
    expect(css).toContain('format("woff2")')
    expect(css).toContain("font-weight: 400;")
    expect(css).toContain("font-weight: 800;")
    expect(css).toContain("font-style: italic;")
  })

  it("emits only the full rule for a face without a Latin subset", () => {
    const css = fontFaceCss({
      family: "Custom",
      faces: [{ weight: 400, style: "normal", url: "custom.woff2", format: "woff2" }],
    })
    expect(css.match(/@font-face/g)).toHaveLength(1)
    expect(css).not.toContain("unicode-range")
  })

  it("puts each Latin rule after its full rule, so browsers try the subset first", () => {
    for (const face of roundHogFaces) {
      expect(roundHogFontFaceCss.indexOf(face.latin.url)).toBeGreaterThan(
        roundHogFontFaceCss.indexOf(`url("${face.url}")`),
      )
    }
  })
})

describe("roundHog Latin subsets", () => {
  const fontsDir = join(import.meta.dirname, "..", "assets", "fonts")
  const fileOf = (url: string): string => fileURLToPath(url).split("/src/fonts/").at(-1) ?? ""
  const read = (url: string): Buffer => readFileSync(join(fontsDir, fileOf(url)))

  it.each(roundHogFaces.map((f) => [`${f.weight}/${f.style}`, f] as const))(
    "%s ships the current subset of its own full face, with its exact Latin range",
    async (_, face) => {
      const latin = codepointsInRanges(LATIN_TARGET_RANGES)
      const inTarget = (await fontCodepoints(read(face.url))).filter((cp) => latin.has(cp))
      expect(face.latin.unicodeRange).toBe(toUnicodeRange(inTarget))
      expect(read(face.latin.url).equals(await latinSubset(read(face.url)))).toBe(true)
    },
  )
})
