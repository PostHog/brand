import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { BUILT_WITH_SPEC, fontFile } from "../scripts/gen-badge-text.ts"
import { outlineText } from "../scripts/lib/outline.ts"
import { BUILT_WITH } from "../site/src/badge-text.ts"

describe("badge lettering (site/src/badge-text.ts)", () => {
  it("was generated from the current spec", () => {
    const { text, face, size, tracking, features } = BUILT_WITH
    expect({ text, face, size, tracking, features }).toEqual(BUILT_WITH_SPEC)
  })

  it("matches a fresh outline of the font, so it is not stale", async () => {
    const { text, face, size, tracking, features } = BUILT_WITH_SPEC
    const fresh = await outlineText(readFileSync(fontFile(face)), text, {
      size,
      tracking,
      features,
    })
    expect({ d: BUILT_WITH.d, advance: BUILT_WITH.advance, ink: BUILT_WITH.ink }).toEqual(fresh)
  })

  it("draws above the baseline (y down), not mirrored below it", () => {
    expect(BUILT_WITH.ink.y).toBeLessThan(-BUILT_WITH.size / 2)
    expect(BUILT_WITH.ink.y + BUILT_WITH.ink.height).toBeCloseTo(0, 0)
  })
})
