// Stamps the version `changeset version` just bumped package.json to into the release ledger
// (assets/releases.json, see scripts/lib/releases.ts): today's date as its release date, and
// that version as `since` for every asset that ships for the first time. Run by the Release
// workflow between the bump and the build, so the published package carries both; the ledger
// is committed alongside the bump.

import { readFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import type { Catalog } from "./lib/catalog.ts"
import { readLedger, stampRelease, writeLedger, type LedgerEntry } from "./lib/releases.ts"
import { NAMESPACES } from "../src/types.ts"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const LEDGER = join(ROOT, "assets", "releases.json")

const { version } = JSON.parse(await readFile(join(ROOT, "package.json"), "utf8")) as {
  version: string
}
const date = new Date().toISOString().slice(0, 10)

const entries: LedgerEntry[] = []
for (const ns of NAMESPACES) {
  const path = join(ROOT, "assets", ns, "catalog.json")
  if (!existsSync(path)) continue
  entries.push(...(JSON.parse(await readFile(path, "utf8")) as Catalog).entries)
}

const before = await readLedger(LEDGER)
const after = stampRelease(before, version, date, entries)
await writeLedger(LEDGER, after)

const added = Object.entries(after.assets).filter(([, a]) => a.since === version).length
console.log(`Stamped v${version} (${after.releases[version]}): ${added} asset(s) first ship in it.`)
