import { describe, expect, it } from "vitest"
import { toUnicodeRange } from "../scripts/lib/fonts.ts"

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
