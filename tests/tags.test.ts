import { describe, expect, it } from "vitest"
import { parseTags } from "../scripts/lib/tags.ts"

describe("parseTags", () => {
  it("returns [] for missing, empty, or whitespace-only descriptions", () => {
    expect(parseTags()).toEqual([])
    expect(parseTags(null)).toEqual([])
    expect(parseTags("")).toEqual([])
    expect(parseTags("   \n  ")).toEqual([])
  })

  it("splits a bare comma-separated list and trims each entry", () => {
    expect(parseTags(" cute , animal ,mascot ")).toEqual(["cute", "animal", "mascot"])
  })

  it("also splits on slashes and periods (messy author separators)", () => {
    expect(parseTags("hog/ solo")).toEqual(["hog", "solo"])
    expect(parseTags("meme. black clothes")).toEqual(["meme", "black clothes"])
    expect(parseTags("dr. manhattan")).toEqual(["dr", "manhattan"])
    // A real description mixing all separators on one line.
    expect(parseTags("hog/ solo, watchmen. dr. manhattan, blue")).toEqual([
      "hog",
      "solo",
      "watchmen",
      "dr",
      "manhattan",
      "blue",
    ])
  })

  it("keeps hyphens and internal spaces intact (not separators)", () => {
    expect(parseTags("hi-vis, lab coat, back to the future")).toEqual([
      "hi-vis",
      "lab coat",
      "back to the future",
    ])
  })

  it("drops empty entries from stray/trailing/doubled separators", () => {
    expect(parseTags("cute,, animal, ,")).toEqual(["cute", "animal"])
    expect(parseTags("a // b .. c")).toEqual(["a", "b", "c"])
  })

  it("de-duplicates case-insensitively, keeping the first spelling and order", () => {
    expect(parseTags("Cute, cute, Animal, CUTE")).toEqual(["Cute", "Animal"])
  })

  it("reads an optional `Tags:` label and ignores surrounding prose", () => {
    expect(parseTags("A friendly hedgehog doctor.\nTags: medical, cute, mascot")).toEqual([
      "medical",
      "cute",
      "mascot",
    ])
    expect(parseTags("tag: solo")).toEqual(["solo"])
  })

  it("falls back to newline-separated lists when there are no commas", () => {
    expect(parseTags("cute\nanimal\nmascot")).toEqual(["cute", "animal", "mascot"])
  })
})
