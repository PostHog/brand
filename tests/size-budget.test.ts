import { existsSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import type { Catalog } from "../scripts/lib/catalog.ts"
import { NAMESPACES } from "../src/types.ts"

const ROOT = join(import.meta.dirname, "..")
const ASSETS = join(ROOT, "assets")
const TOTAL_CAP = 120 * 1024 * 1024

function catalogFor(ns: string): Catalog {
  return JSON.parse(readFileSync(join(ASSETS, ns, "catalog.json"), "utf8")) as Catalog
}

/** On-disk folder for an entry's files; tiered crests nest under <ns>/<tier>/. */
function entryDir(ns: string, tier?: string): string {
  return tier ? join(ASSETS, ns, tier) : join(ASSETS, ns)
}

describe("package size budget", () => {
  it.each(NAMESPACES)("ships both an svg and a png for every %s asset", (ns) => {
    for (const e of catalogFor(ns).entries) {
      const dir = entryDir(ns, e.tier)
      expect(existsSync(join(dir, "vectors", `${e.slug}.svg`)), `${ns}/${e.slug}.svg`).toBe(true)
      expect(existsSync(join(dir, "png", `${e.slug}.png`)), `${ns}/${e.slug}.png`).toBe(true)
    }
  })

  it("keeps the bundled art under the total cap", () => {
    let total = 0
    for (const ns of NAMESPACES) {
      for (const e of catalogFor(ns).entries) {
        const dir = entryDir(ns, e.tier)
        for (const p of [
          join(dir, "vectors", `${e.slug}.svg`),
          join(dir, "png", `${e.slug}.png`),
        ]) {
          if (existsSync(p)) total += statSync(p).size
        }
      }
    }
    expect(total).toBeLessThanOrEqual(TOTAL_CAP)
  })
})
