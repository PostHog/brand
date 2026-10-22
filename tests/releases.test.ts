import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { stampRelease, type LedgerEntry, type ReleaseLedger } from "../scripts/lib/releases.ts"
import { allAssets } from "../src/generated/manifest.ts"
import { release } from "../src/generated/release.ts"

const ROOT = join(import.meta.dirname, "..")

const hog = (slug: string, figmaNodeId: string): LedgerEntry => ({
  namespace: "hoggies",
  slug,
  figmaNodeId,
})

const LEDGER: ReleaseLedger = {
  releases: { "0.1.0": "2026-06-24" },
  assets: {
    "hoggies/chart": { since: "0.1.0", figmaNodeId: "1:1" },
    "hoggies/ball-hog": { since: "0.1.0", figmaNodeId: "1:2" },
    "hoggies/bat": { since: "0.1.0", figmaNodeId: "1:3" },
  },
}

describe("stampRelease", () => {
  const next = stampRelease(LEDGER, "0.2.0", "2026-07-01", [
    hog("chart", "9:9"), // same slug, new node: same asset
    hog("ball", "1:2"), // new slug, same node: a Figma rename
    hog("heart", "2:1"), // brand new
  ])

  it("records the release date", () => {
    expect(next.releases).toEqual({ "0.1.0": "2026-06-24", "0.2.0": "2026-07-01" })
  })

  it("keeps a known asset's since and refreshes its node id", () => {
    expect(next.assets["hoggies/chart"]).toEqual({ since: "0.1.0", figmaNodeId: "9:9" })
  })

  it("carries since across a rename on the same node", () => {
    expect(next.assets["hoggies/ball"]?.since).toBe("0.1.0")
    expect(next.assets["hoggies/ball-hog"]).toBeUndefined()
  })

  it("stamps a new asset with the release and drops removed ones", () => {
    expect(next.assets["hoggies/heart"]?.since).toBe("0.2.0")
    expect(next.assets["hoggies/bat"]).toBeUndefined()
  })

  it("doesn't treat a node in another group as a rename", () => {
    const crests = stampRelease(LEDGER, "0.2.0", "2026-07-01", [
      { namespace: "crests", tier: "full", slug: "ball", figmaNodeId: "1:2" },
    ])
    expect(crests.assets["crests/full/ball"]?.since).toBe("0.2.0")
  })

  it("never moves an already-stamped release date", () => {
    expect(stampRelease(LEDGER, "0.1.0", "2030-01-01", []).releases["0.1.0"]).toBe("2026-06-24")
  })
})

describe("generated release data", () => {
  it("exports this package's version with its release date", () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as { version: string }
    expect(release.version).toBe(pkg.version)
    expect(release.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it("dates every asset's since, never later than this release", () => {
    for (const asset of allAssets) {
      if (!asset.since) continue
      expect(asset.since.date, `${asset.namespace}/${asset.slug}`).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(asset.since.date <= release.date, `${asset.namespace}/${asset.slug}`).toBe(true)
    }
  })
})
