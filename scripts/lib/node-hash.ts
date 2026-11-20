// Change detection for sync: has an asset's Figma node changed since it was last rendered,
// ignoring where it sits on the canvas?
//
// The REST API reports every node's bounds in page coordinates (`absoluteBoundingBox`,
// `absoluteRenderBounds`), and they're the only geometry it returns without
// `geometry=paths` (~700 MB for the hoggies frame, too big to parse). The hoggies frame is
// an alphabetical grid, so adding one hoggie moves every hoggie after it, and hashing the
// raw bounds re-rendered all of those (137 of 202 for one new hoggie) for nothing but
// sub-pixel noise in the output. Rebasing the bounds on the asset's own corner isn't enough
// to hash them: Figma computes them in float32 at page scale, so a moved node's bounds come
// back up to ~0.003 px off, and with thousands per hoggie, any rounding grid has some value
// straddling a step (measured: 22-98 of 137 moved hoggies still flip, at grids of 1-0.01 px).
//
// So an asset is checked in two parts:
//   - `hash`: everything but the bounds (structure, names, fills, strokes, text…), exact.
//   - `geometry`: a few random-sign sums of the bounds, compared within a tolerance. The
//     signs (fixed per node id) keep the float32 bias from piling up the way a plain sum
//     does (measured: ≤ 0.09 px across those 137 moves, vs 2.7 px for a plain sum), while
//     any one bound moving by δ shifts every sum by exactly δ, and several moving at once
//     can't cancel in all of them.

import { createHash } from "node:crypto"
import type { FigmaNode } from "./figma.ts"

const BOX_KEYS = ["absoluteBoundingBox", "absoluteRenderBounds"] as const
const PROJECTIONS = 4
/** Bounds noise on a move stays under 0.09 px; a real edit this size or bigger is caught. */
export const GEOMETRY_TOLERANCE_PX = 0.5

interface Box {
  x: number
  y: number
  width: number
  height: number
}

const isBox = (v: unknown): v is Box =>
  v != null &&
  typeof v === "object" &&
  typeof (v as Box).x === "number" &&
  typeof (v as Box).y === "number"

const sha = (s: string): Buffer => createHash("sha256").update(s).digest()

/** Hash of everything in the subtree except the page-coordinate bounds. */
export function hashNode(node: FigmaNode): string {
  const json = JSON.stringify(node, (key, value: unknown) =>
    (BOX_KEYS as readonly string[]).includes(key) ? undefined : value,
  )
  return sha(json).toString("hex").slice(0, 16)
}

/** The subtree's bounds, relative to its own corner, folded into a few signed sums. */
export function nodeGeometry(root: FigmaNode): number[] {
  const origin = isBox(root.absoluteBoundingBox) ? root.absoluteBoundingBox : { x: 0, y: 0 }
  const sums = Array.from({ length: PROJECTIONS }, () => 0)
  const walk = (node: FigmaNode): void => {
    const digest = sha(node.id)
    let bit = 0
    for (const key of BOX_KEYS) {
      const box = node[key]
      const values = isBox(box)
        ? [box.x - origin.x, box.y - origin.y, box.width, box.height]
        : [0, 0, 0, 0]
      for (const value of values) {
        for (let p = 0; p < PROJECTIONS; p++, bit++) {
          const sign = (digest[bit >> 3]! >> (bit & 7)) & 1 ? 1 : -1
          sums[p]! += sign * value
        }
      }
    }
    for (const child of node.children ?? []) walk(child)
  }
  walk(root)
  return sums.map((s) => Math.round(s * 1000) / 1000)
}

export function sameGeometry(a: readonly number[] | undefined, b: readonly number[]): boolean {
  return a?.length === b.length && a.every((v, i) => Math.abs(v - b[i]!) <= GEOMETRY_TOLERANCE_PX)
}

/**
 * The hash before {@link hashNode} left the bounds out (sha256 of the raw node). Still
 * accepted from a sync-state entry without `geometry`, so switching doesn't re-render every
 * asset; drop it once sync-state.json has been written by the new scheme.
 */
export function legacyHashNode(node: FigmaNode): string {
  return sha(JSON.stringify(node)).toString("hex").slice(0, 16)
}
