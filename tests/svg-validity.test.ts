import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { ASSET_GROUPS } from "../src/types.ts"

const ASSETS = join(import.meta.dirname, "..", "assets")

// One row per bundled SVG. Tiered crests live under assets/<ns>/<tier>/vectors; everything
// else under assets/<ns>/vectors. `ns` is the namespace the SVG ids are prefixed with.
const files: { ns: string; dir: string; file: string }[] = ASSET_GROUPS.flatMap((group) => {
  const dir = group.tier
    ? join(ASSETS, group.namespace, group.tier, "vectors")
    : join(ASSETS, group.namespace, "vectors")
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => f.endsWith(".svg"))
    .map((file) => ({ ns: group.namespace, dir, file }))
})

describe("bundled vectors", () => {
  it("has at least one vector", () => {
    expect(files.length).toBeGreaterThan(0)
  })

  it.each(files)("$ns/$file is a valid, safe, prefixed SVG", ({ ns, dir, file }) => {
    const slug = file.replace(/\.svg$/, "")
    const svg = readFileSync(join(dir, file), "utf8")

    // Single root <svg> with a viewBox and no intrinsic dimensions.
    expect(svg).toMatch(/<svg\b/)
    expect(svg).toMatch(/viewBox\s*=/)
    const root = svg.slice(0, svg.indexOf(">") + 1)
    expect(root).not.toMatch(/\bwidth\s*=/)
    expect(root).not.toMatch(/\bheight\s*=/)

    // Every id is namespaced as `<namespace>-<slug>-…` so two inlined assets never collide.
    const ids = [...svg.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1])
    for (const id of ids) {
      expect(id?.startsWith(`${ns}-${slug}-`)).toBe(true)
    }

    // No active content — this markup is injected via dangerouslySetInnerHTML.
    expect(svg).not.toMatch(/<script/i)
    expect(svg).not.toMatch(/\son\w+\s*=/i)
    expect(svg).not.toMatch(/javascript:/i)
  })
})
