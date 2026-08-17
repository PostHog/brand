import { describe, expect, it } from "vitest"
import {
  assertNoCollisions,
  componentName,
  dedupeSlugs,
  pngConstName,
  slugToPascal,
  slugify,
  svgConstName,
} from "../scripts/lib/naming.ts"

describe("slugify", () => {
  it.each([
    ["Doc Brown", "doc-brown"],
    ["70's dance hog", "70s-dance-hog"],
    ["i'm the driver", "im-the-driver"],
    ["waiter, server", "waiter-server"],
    ["piñata hog", "pinata-hog"],
    ["Color (gradient)", "color-gradient"],
    ["9-9-6", "9-9-6"],
  ])("slugify(%s) === %s", (name, expected) => {
    expect(slugify(name)).toBe(expected)
  })
})

describe("slug -> identifier", () => {
  it.each([
    ["doc-brown", "DocBrown"],
    ["70-s-dance-hog", "70SDanceHog"],
    ["996-coder-hog", "996CoderHog"],
    ["404", "404"],
    ["marketing-mini", "MarketingMini"],
    // "ai" is a known acronym: whole segments upper-case, substrings don't.
    ["ai-gateway", "AIGateway"],
    ["ai-research", "AIResearch"],
    ["posthog-ai", "PosthogAI"],
    ["waiter-server", "WaiterServer"],
  ])("slugToPascal(%s) === %s", (slug, expected) => {
    expect(slugToPascal(slug)).toBe(expected)
  })

  it("upper-cases acronym segments in component + const names", () => {
    expect(componentName("crests", "ai-gateway", "full")).toBe("AIGatewayCrest")
    expect(componentName("crests", "ai-gateway", "mini")).toBe("AIGatewayCrestMini")
  })

  it("prefixes component names per namespace", () => {
    expect(componentName("hoggies", "reading-is-magic")).toBe("HedgehogReadingIsMagic")
    expect(componentName("crests", "marketing", "full")).toBe("MarketingCrest")
    expect(componentName("crests", "marketing", "mini")).toBe("MarketingCrestMini")
  })

  it("derives svg/png const names", () => {
    expect(svgConstName("hoggies", "reading-is-magic")).toBe("hedgehogReadingIsMagicSvg")
    expect(pngConstName("hoggies", "reading-is-magic")).toBe("hedgehogReadingIsMagicPng")
    expect(svgConstName("crests", "marketing", "mini")).toBe("marketingCrestMiniSvg")
    expect(pngConstName("crests", "marketing", "mini")).toBe("marketingCrestMiniPng")
  })

  it("produces valid JS identifiers for every component name", () => {
    const slugs = ["404", "70-s-dance-hog", "996-coder-hog", "a", "z-9"]
    for (const slug of slugs) {
      expect(componentName("hoggies", slug)).toMatch(/^[A-Za-z_$][A-Za-z0-9_$]*$/)
    }
  })
})

describe("dedupeSlugs", () => {
  it("disambiguates repeated slugs with a numeric suffix", () => {
    expect(dedupeSlugs(["wizard-hog", "marketing", "wizard-hog"])).toEqual([
      "wizard-hog",
      "marketing",
      "wizard-hog-2",
    ])
  })

  it("leaves unique slugs untouched", () => {
    expect(dedupeSlugs(["a", "b", "c"])).toEqual(["a", "b", "c"])
  })
})

describe("collision detection", () => {
  it("passes for distinct names", () => {
    expect(() => assertNoCollisions("hoggies", ["doc-brown", "404", "pirate"])).not.toThrow()
  })

  it("ignores duplicate slugs (same asset listed twice)", () => {
    expect(() => assertNoCollisions("hoggies", ["pirate", "pirate"])).not.toThrow()
  })

  it("throws when two slugs collapse to the same component name", () => {
    expect(() => assertNoCollisions("hoggies", ["foo-bar", "foo--bar"])).toThrow(/collision/i)
  })
})
