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
    ["Doctor Hog", "doctor-hog"],
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
    ["doctor-hog", "DoctorHog"],
    ["70-s-dance-hog", "70SDanceHog"],
    ["996-coder-hog", "996CoderHog"],
    ["404", "404"],
    ["array-mini", "ArrayMini"],
  ])("slugToPascal(%s) === %s", (slug, expected) => {
    expect(slugToPascal(slug)).toBe(expected)
  })

  it("prefixes component names per namespace", () => {
    expect(componentName("hoggies", "doctor-hog")).toBe("HedgehogDoctorHog")
    expect(componentName("crests", "array", "full")).toBe("ArrayCrest")
    expect(componentName("crests", "array", "mini")).toBe("ArrayCrestMini")
  })

  it("derives svg/png const names", () => {
    expect(svgConstName("hoggies", "doctor-hog")).toBe("hedgehogDoctorHogSvg")
    expect(pngConstName("hoggies", "doctor-hog")).toBe("hedgehogDoctorHogPng")
    expect(svgConstName("crests", "array", "mini")).toBe("arrayCrestMiniSvg")
    expect(pngConstName("crests", "array", "mini")).toBe("arrayCrestMiniPng")
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
    expect(dedupeSlugs(["wizard-hog", "array", "wizard-hog"])).toEqual([
      "wizard-hog",
      "array",
      "wizard-hog-2",
    ])
  })

  it("leaves unique slugs untouched", () => {
    expect(dedupeSlugs(["a", "b", "c"])).toEqual(["a", "b", "c"])
  })
})

describe("collision detection", () => {
  it("passes for distinct names", () => {
    expect(() => assertNoCollisions("hoggies", ["doctor-hog", "404", "pirate"])).not.toThrow()
  })

  it("ignores duplicate slugs (same asset listed twice)", () => {
    expect(() => assertNoCollisions("hoggies", ["pirate", "pirate"])).not.toThrow()
  })

  it("throws when two slugs collapse to the same component name", () => {
    expect(() => assertNoCollisions("hoggies", ["foo-bar", "foo--bar"])).toThrow(/collision/i)
  })
})
