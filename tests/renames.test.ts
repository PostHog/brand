import { describe, expect, it } from "vitest"
import { applyRename, titleFromSlug } from "../scripts/lib/renames.ts"

describe("applyRename", () => {
  it("passes through assets with no rule", () => {
    expect(applyRename("hoggies", "doctor-hog", "Doctor Hog")).toEqual({
      slug: "doctor-hog",
      name: "Doctor Hog",
    })
    expect(applyRename("crests", "array", "Array")).toEqual({
      slug: "array",
      name: "Array",
    })
  })

  it("applies the configured dadd-ai renames (slug + name)", () => {
    expect(applyRename("hoggies", "dadd-ai-l", "Dadd-ai L")).toEqual({
      slug: "dadd-ai-left",
      name: "Dadd AI Left",
    })
    expect(applyRename("hoggies", "dadd-ai-r", "Dadd-ai R")).toEqual({
      slug: "dadd-ai-right",
      name: "Dadd AI Right",
    })
  })
})

describe("titleFromSlug", () => {
  it.each([
    ["foo-bar-baz", "Foo Bar Baz"],
    ["dadd-ai-left", "Dadd Ai Left"],
    ["array", "Array"],
  ])("titleFromSlug(%s) === %s", (slug, expected) => {
    expect(titleFromSlug(slug)).toBe(expected)
  })
})
