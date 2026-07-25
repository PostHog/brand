import { describe, expect, it } from "vitest"
import { applyRename } from "../scripts/lib/renames.ts"
import { inferVariants } from "../scripts/lib/variants.ts"

describe("inferVariants", () => {
  it("groups a numbered family onto its base slug, lowest number first", () => {
    const index = inferVariants(["wizard-1", "wizard-2", "wizard-5", "lemonade"])

    expect(index.resolve("wizard-1")).toEqual({
      baseSlug: "wizard",
      variant: "1",
      isDefault: true,
    })
    expect(index.resolve("wizard-5")).toEqual({
      baseSlug: "wizard",
      variant: "5",
      isDefault: false,
    })
    // An unnumbered slug is a standalone asset.
    expect(index.resolve("lemonade")).toBeUndefined()
  })

  it("keeps a multi-word base intact and doesn't group unrelated prefixes", () => {
    const index = inferVariants(["mr-potato-head-1", "mr-potato-head-2", "desk-wizard"])

    expect(index.resolve("mr-potato-head-2")?.baseSlug).toBe("mr-potato-head")
    expect(index.resolve("desk-wizard")).toBeUndefined()
  })

  it("defaults to the numerically lowest variant, not the lexically first", () => {
    // "10" sorts before "9" as a string; the default must still be "9".
    const index = inferVariants(["hog-10", "hog-9"])

    expect(index.resolve("hog-9")?.isDefault).toBe(true)
    expect(index.resolve("hog-10")?.isDefault).toBe(false)
  })

  it("leaves a dedupeSlugs artifact standalone when the bare base slug exists", () => {
    // `dedupeSlugs` (src/naming.ts) only ever emits `foo-2` alongside a bare `foo` — two
    // Figma nodes with the same name, not a family. Grouping it would collide with `foo`.
    const index = inferVariants(["query-performance", "query-performance-2"])

    expect(index.resolve("query-performance-2")).toBeUndefined()
    expect(index.resolve("query-performance")).toBeUndefined()
  })

  it("groups a lone numbered slug so its export survives a sibling landing later", () => {
    const lone = inferVariants(["doctor-2"])
    expect(lone.resolve("doctor-2")).toEqual({
      baseSlug: "doctor",
      variant: "2",
      isDefault: true,
    })

    // Adding "doctor-1" keeps the same base (i.e. the same `HedgehogDoctor` export) and
    // just moves the default.
    const family = inferVariants(["doctor-1", "doctor-2"])
    expect(family.resolve("doctor-2")).toEqual({
      baseSlug: "doctor",
      variant: "2",
      isDefault: false,
    })
  })

  it("runs on published slugs, so a rename can opt an asset out of a family", () => {
    // Raw Figma slug "9-9-6" would read as variant "6" of a base "9-9"; renames.ts
    // publishes it as "996", which has no numeric suffix at all.
    const raw = inferVariants(["9-9-6"])
    expect(raw.resolve("9-9-6")?.baseSlug).toBe("9-9")

    const published = applyRename("hoggies", "9-9-6", "9-9-6").slug
    expect(inferVariants([published]).resolve(published)).toBeUndefined()
  })
})
