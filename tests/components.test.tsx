import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import * as hoggies from "../src/generated/hoggies/components/index.ts"
import * as crestsFull from "../src/generated/crests/full/components/index.ts"
import * as crestsMini from "../src/generated/crests/mini/components/index.ts"
import * as crests from "../src/generated/crests/index.ts"
import { assets as hoggiesAssets } from "../src/generated/hoggies/manifest.ts"
import { assets as crestsFullAssets } from "../src/generated/crests/full/manifest.ts"
import { assets as crestsMiniAssets } from "../src/generated/crests/mini/manifest.ts"
import { componentName, slugToPascal } from "../src/naming.ts"
import type { AssetMeta } from "../src/types.ts"
import type { SvgAssetComponent } from "../src/runtime/create-svg-asset.tsx"

// One entry per export group: crests fan out into full + mini, each its own module tree.
const GROUPS = [
  { name: "hoggies", components: hoggies, assets: hoggiesAssets },
  { name: "crests/full", components: crestsFull, assets: crestsFullAssets },
  { name: "crests/mini", components: crestsMini, assets: crestsMiniAssets },
] as const

function lookup(components: object, meta: AssetMeta): SvgAssetComponent {
  return (components as Record<string, SvgAssetComponent>)[
    componentName(meta.namespace, meta.slug, meta.tier)
  ]!
}

describe("generated components", () => {
  it.each(GROUPS)("exports exactly one component per asset in $name", ({ components, assets }) => {
    expect(Object.keys(components).length).toBe(assets.length)
    for (const meta of assets) {
      expect(lookup(components, meta)).toBeDefined()
    }
  })

  it.each(GROUPS)(
    "every $name component renders an svg with its metadata",
    ({ components, assets }) => {
      for (const meta of assets) {
        const Component = lookup(components, meta)
        expect(Component.meta.slug).toBe(meta.slug)
        const html = renderToStaticMarkup(createElement(Component))
        expect(html).toContain("<svg")
        expect(html).toContain("viewBox=")
      }
    },
  )

  it("renders an accessible label when given a title, decorative otherwise", () => {
    const meta = hoggiesAssets[0]!
    const Component = lookup(hoggies, meta)
    const titled = renderToStaticMarkup(createElement(Component, { title: "A test hog" }))
    expect(titled).toContain('role="img"')
    expect(titled).toContain("<title>A test hog</title>")

    const decorative = renderToStaticMarkup(createElement(Component))
    expect(decorative).toContain('aria-hidden="true"')
  })

  it("maps `size` to width", () => {
    const Component = lookup(hoggies, hoggiesAssets[0]!)
    const html = renderToStaticMarkup(createElement(Component, { size: 120 }))
    expect(html).toContain('width="120"')
  })

  it("escapes titles to prevent markup injection", () => {
    const Component = lookup(hoggies, hoggiesAssets[0]!)
    const html = renderToStaticMarkup(createElement(Component, { title: "<b>x</b>" }))
    expect(html).toContain("&lt;b&gt;x&lt;/b&gt;")
    expect(html).not.toContain("<title><b>x</b></title>")
  })
})

describe("combined crests barrel (@posthog/brand/crests)", () => {
  type Combined = SvgAssetComponent & { Mini?: SvgAssetComponent }
  const all = crests as Record<string, Combined>

  it("exposes one <Name>Crest per crest slug across both tiers", () => {
    const slugs = new Set([
      ...crestsFullAssets.map((a) => a.slug),
      ...crestsMiniAssets.map((a) => a.slug),
    ])
    expect(Object.keys(all).length).toBe(slugs.size)
  })

  it("renders the full crest as the base and the mini as `.Mini`", () => {
    // `array` exists in both tiers.
    const ArrayCrest = all.ArrayCrest!
    expect(ArrayCrest).toBeDefined()
    expect(ArrayCrest.meta.tier).toBe("full")
    expect(ArrayCrest.Mini?.meta.tier).toBe("mini")
    expect(ArrayCrest.Mini?.meta.slug).toBe("array")

    expect(renderToStaticMarkup(createElement(ArrayCrest))).toContain("<svg")
    expect(renderToStaticMarkup(createElement(ArrayCrest.Mini!))).toContain("<svg")
  })

  it("the compound base and its tier exports are the same component", () => {
    expect(all.ArrayCrest).toBe(crestsFull.ArrayCrest)
    expect(all.ArrayCrest!.Mini).toBe(crestsMini.ArrayCrestMini)
  })

  it("omits `.Mini` for a full-only crest", () => {
    const full = crestsFullAssets.find((a) => !crestsMiniAssets.some((m) => m.slug === a.slug))
    if (!full) return // every full crest also has a mini in this build
    const Combined = all[`${slugToPascal(full.slug)}Crest`]!
    expect(Combined).toBeDefined()
    expect(Combined.meta.tier).toBe("full")
    expect(Combined.Mini).toBeUndefined()
  })
})
