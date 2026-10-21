// The release ledger, `assets/releases.json`: when each published version shipped, and which
// version first shipped each asset. Written by `stamp-release.ts` right after
// `changeset version` in the Release workflow; read by `codegen.ts`, which turns it into
// `AssetMeta.since` and the root `release` export.
//
// Assets are keyed like `sync-state.json` — `<namespace>/<slug>` with the raw Figma slug, plus
// the tier for crests (`crests/mini/marketing`) — so the codegen renames in renames.ts never
// touch it. A Figma rename changes that key, so each entry also remembers its Figma node id: a
// key that vanishes while a new key appears on the same node is the same asset, renamed, and
// keeps its `since`.

import { readFile, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import type { CrestTier, Namespace } from "../../src/types.ts"

export interface LedgerAsset {
  /** Version that first shipped this asset, e.g. "0.9.0". */
  since: string
  /** Figma node id at the last stamp — how a renamed asset is recognised. */
  figmaNodeId: string
}

export interface ReleaseLedger {
  /** Published version → its release date (UTC, `YYYY-MM-DD`). */
  releases: Record<string, string>
  /** Asset key (see {@link ledgerKey}) → when it first shipped. */
  assets: Record<string, LedgerAsset>
}

/** A catalog entry as far as the ledger cares. */
export interface LedgerEntry {
  namespace: Namespace
  tier?: CrestTier
  /** Raw Figma (catalog) slug, not the renamed one. */
  slug: string
  figmaNodeId: string
}

/** `hoggies/chart`, `crests/full/marketing` — the same keys as `sync-state.json`. */
export function ledgerKey(e: Pick<LedgerEntry, "namespace" | "tier" | "slug">): string {
  return e.tier ? `${e.namespace}/${e.tier}/${e.slug}` : `${e.namespace}/${e.slug}`
}

/** The export group part of a key (`hoggies`, `crests/full`): renames never cross it. */
function groupOf(key: string): string {
  return key.slice(0, key.lastIndexOf("/"))
}

/**
 * Record `version` as released on `date`, and stamp every entry the ledger doesn't know yet
 * as first shipped in it. A known key keeps its `since`; an unknown key on the node id of a
 * key that is gone (within the same group) is a rename and inherits that `since`. Keys no
 * longer in the catalogs are dropped, so an asset that is removed and later re-added counts
 * from its return. Pure: returns a new ledger with keys sorted.
 */
export function stampRelease(
  ledger: ReleaseLedger,
  version: string,
  date: string,
  entries: readonly LedgerEntry[],
): ReleaseLedger {
  const current = new Map(entries.map((e) => [ledgerKey(e), e]))
  const gone = Object.entries(ledger.assets).filter(([key]) => !current.has(key))

  const assets: Record<string, LedgerAsset> = {}
  for (const [key, e] of current) {
    const renamedFrom = gone.find(
      ([oldKey, old]) => old.figmaNodeId === e.figmaNodeId && groupOf(oldKey) === groupOf(key),
    )
    const since = ledger.assets[key]?.since ?? renamedFrom?.[1].since ?? version
    assets[key] = { since, figmaNodeId: e.figmaNodeId }
  }

  return {
    releases: sortKeys({ ...ledger.releases, [version]: ledger.releases[version] ?? date }),
    assets: sortKeys(assets),
  }
}

/** Sorted with numeric segments compared as numbers, so `0.10.0` follows `0.9.0`. */
function sortKeys<T>(record: Record<string, T>): Record<string, T> {
  return Object.fromEntries(
    Object.entries(record).sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })),
  )
}

export async function readLedger(path: string): Promise<ReleaseLedger> {
  if (!existsSync(path)) return { releases: {}, assets: {} }
  return JSON.parse(await readFile(path, "utf8")) as ReleaseLedger
}

export async function writeLedger(path: string, ledger: ReleaseLedger): Promise<void> {
  await writeFile(path, `${JSON.stringify(ledger, null, 2)}\n`)
}
