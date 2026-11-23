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
  /** Hash of the asset's Figma node subtree, bounds left out (see scripts/lib/node-hash.ts). */
  nodeHash: string
  /**
   * The subtree's bounds as of the last render, folded into a few sums and compared within
   * a tolerance. Kept from the render rather than refreshed each sync, so changes too small
   * to trigger one still add up until they do.
   */
  geometry?: number[]
}

/** `assets/sync-state.json`. Entries keyed by `"<namespace>/<slug>"`. */
export interface SyncState {
  figmaFileKey: string
  figmaVersion: string
  entries: Record<string, SyncStateEntry>
}
