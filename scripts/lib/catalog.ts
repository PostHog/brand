// Shared types for the on-disk catalogs. `sync.ts` writes these; `codegen.ts` reads them.
// One catalog per namespace lives at assets/<namespace>/catalog.json.

import type { AssetMeta, Namespace } from "../../src/types.ts"

/** A catalog entry is the public metadata plus byte bookkeeping for size reporting. */
export interface CatalogEntry extends AssetMeta {
  /** Bytes of the optimized inline SVG. */
  svgBytes: number
  /** Bytes of the bundled PNG. */
  pngBytes: number
}

/** `assets/<namespace>/catalog.json`. */
export interface Catalog {
  generatedAt: string
  figmaFileKey: string
  /** Figma file `version` at sync time (detects upstream edits). */
  figmaVersion: string
  namespace: Namespace
  entries: CatalogEntry[]
}

/** Per-asset bookkeeping used to skip unchanged assets on the next sync. */
export interface SyncStateEntry {
  figmaNodeId: string
  /** Hash of the asset's Figma node subtree (detects content changes). */
  nodeHash: string
}

/** `assets/sync-state.json`. Entries keyed by `"<namespace>/<slug>"`. */
export interface SyncState {
  figmaFileKey: string
  figmaVersion: string
  entries: Record<string, SyncStateEntry>
}
