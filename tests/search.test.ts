import { describe, expect, it } from "vitest"
import { findAssets, getAsset } from "../src/search.ts"
import { allAssets } from "../src/generated/manifest.ts"

describe("findAssets", () => {
  it("returns the whole manifest with no filter", () => {
    expect(findAssets()).toHaveLength(allAssets.length)
  })

  it("filters by a single namespace and by a list", () => {
    const hoggies = findAssets({ namespace: "hoggies" })
    expect(hoggies.length).toBeGreaterThan(0)
    expect(hoggies.every((a) => a.namespace === "hoggies")).toBe(true)

    const multi = findAssets({ namespace: ["hoggies", "crests"] })
    expect(multi.every((a) => a.namespace === "hoggies" || a.namespace === "crests")).toBe(true)
    expect(multi.length).toBeGreaterThanOrEqual(hoggies.length)
  })

  it("filters crests by tier", () => {
    const full = findAssets({ namespace: "crests", tier: "full" })
    const mini = findAssets({ namespace: "crests", tier: "mini" })
    expect(full.length).toBeGreaterThan(0)
    expect(mini.length).toBeGreaterThan(0)
    expect(full.every((a) => a.tier === "full")).toBe(true)
    expect(mini.every((a) => a.tier === "mini")).toBe(true)
  })

  it("filters by variant props", () => {
    const withVariant = allAssets.find((a) => a.variant && Object.keys(a.variant).length > 0)
    if (!withVariant) return // no bundled asset carries Figma variant props in this build
    const [key, value] = Object.entries(withVariant.variant!)[0]!
    const hits = findAssets({ variant: { [key]: value } })
    expect(hits.some((a) => a.slug === withVariant.slug)).toBe(true)
    expect(hits.every((a) => a.variant?.[key] === value)).toBe(true)
  })

  it("requires every query word to match, not the whole query as one substring", () => {
    // The five hogs in a car: each is tagged "car" or "driving", none says so in its name.
    const byTag = findAssets({ namespace: "hoggies", text: "car" }).map((a) => a.slug)
    expect(byTag.length).toBeGreaterThan(1)

    for (const text of ["hog car", "car hog", "a hedgehog in a car", "Hedgehog In A Car?"]) {
      const hits = findAssets({ namespace: "hoggies", text }).map((a) => a.slug)
      expect(hits.length).toBeGreaterThan(0)
      expect(byTag).toEqual(expect.arrayContaining(hits))
    }

    // A word that matches nothing still rules the asset out.
    expect(findAssets({ namespace: "hoggies", text: "car zzzznope" })).toHaveLength(0)
  })

  it("reads a hyphen as a space and ignores apostrophes", () => {
    // `driving-hogzilla` is tagged "hot rod" and "self driving": both spellings must find it.
    for (const text of ["hot rod", "hot-rod", "self driving car", "self-driving car"]) {
      const hits = findAssets({ namespace: "hoggies", text }).map((a) => a.slug)
      expect(hits).toContain("driving-hogzilla")
    }

    // An apostrophe on either side of the match drops out, so "70's" and "70s" agree.
    for (const text of ["70's dance", "70s dance"]) {
      expect(findAssets({ text }).map((a) => a.slug)).toContain("70s-dance")
    }
    expect(findAssets({ text: "'car'" }).length).toBeGreaterThan(0)
  })

  it("returns nothing for a query that is only separators", () => {
    // No word to match is not the same as no query: these must not fall through to "all".
    for (const text of ["?", "!", "...", "@#$", "🦔", "  ?  "]) {
      expect(findAssets({ text })).toHaveLength(0)
    }
    // An empty query is still "no filter at all".
    expect(findAssets({ text: "   " })).toHaveLength(allAssets.length)
  })

  it("matches the generated component name", () => {
    const hits = findAssets({ text: "hedgehogdrivinghogzilla" })
    expect(hits.map((a) => a.slug)).toContain("driving-hogzilla")
  })

  it("does a case-insensitive text search across name/slug", () => {
    const sample = allAssets[0]!
    const word = sample.name.split(/\s+/)[0]!
    const hits = findAssets({ text: word.toUpperCase() })
    expect(hits.some((a) => a.slug === sample.slug)).toBe(true)
  })

  it("matches tags via free text and via the `tags` filter", () => {
    const tagged = allAssets.find((a) => a.tags && a.tags.length > 0)
    if (!tagged) return // no bundled asset carries tags in this build (none synced yet)
    const tag = tagged.tags![0]!

    const byText = findAssets({ text: tag.toUpperCase() })
    expect(byText.some((a) => a.slug === tagged.slug)).toBe(true)

    const byTag = findAssets({ tags: tag })
    expect(byTag.some((a) => a.slug === tagged.slug)).toBe(true)
    expect(
      byTag.every((a) => (a.tags ?? []).some((t) => t.toLowerCase() === tag.toLowerCase())),
    ).toBe(true)

    // A tag that no asset has yields nothing.
    expect(findAssets({ tags: "definitely-not-a-real-tag-xyz" })).toHaveLength(0)
  })
})

describe("getAsset", () => {
  it("finds a known asset and returns undefined for an unknown one", () => {
    const sample = allAssets[0]!
    expect(getAsset(sample.namespace, sample.slug)?.slug).toBe(sample.slug)
    expect(getAsset("hoggies", "nope-not-real")).toBeUndefined()
  })

  it("disambiguates a shared crest slug by tier", () => {
    const mini = allAssets.find((a) => a.namespace === "crests" && a.tier === "mini")
    if (!mini) return // no crests bundled in this build
    expect(getAsset("crests", mini.slug, "mini")?.tier).toBe("mini")
    const full = getAsset("crests", mini.slug, "full")
    if (full) expect(full.tier).toBe("full")
  })
})
