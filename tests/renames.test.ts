import type { Namespace } from "../src/types.ts"
import { describe, expect, it } from "vitest"
import { applyRename, titleFromSlug } from "../scripts/lib/renames.ts"

describe("applyRename", () => {
  it.each<[Namespace, string, string, { slug: string; name: string }]>([
    // No rule: inputs pass through unchanged.
    ["hoggies", "doc-brown", "Doc Brown", { slug: "doc-brown", name: "Doc Brown" }],
    ["crests", "array", "Array", { slug: "array", name: "Array" }],
    // Configured renames (slug + name).
    ["hoggies", "9-9-6", "9-9-6", { slug: "996", name: "996" }],
  ])("applyRename(%s, %s, %s)", (namespace, slug, name, expected) => {
    expect(applyRename(namespace, slug, name)).toEqual(expected)
  })
})

describe("titleFromSlug", () => {
  it.each([
    ["foo-bar-baz", "Foo Bar Baz"],
    ["array", "Array"],
  ])("titleFromSlug(%s) === %s", (slug, expected) => {
    expect(titleFromSlug(slug)).toBe(expected)
  })
})
