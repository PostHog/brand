import { describe, expect, it } from "vitest"
import type { FigmaNode } from "../scripts/lib/figma.ts"
import {
  GEOMETRY_TOLERANCE_PX,
  hashNode,
  legacyHashNode,
  nodeGeometry,
  sameGeometry,
} from "../scripts/lib/node-hash.ts"

const box = (x: number, y: number, width = 10, height = 10) => ({ x, y, width, height })

/** A hoggie with two parts, placed at (x, y) on the canvas; `jitter` mimics float32 noise. */
function hoggie(x: number, y: number, { eyeX = 100, eyeW = 50, jitter = 0 } = {}): FigmaNode {
  const part = (id: string, dx: number, dy: number, w: number): FigmaNode => ({
    id,
    name: id,
    type: "VECTOR",
    fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0, a: 1 } }],
    absoluteBoundingBox: box(x + dx + jitter, y + dy - jitter, w + jitter, 20),
    absoluteRenderBounds: box(x + dx - jitter, y + dy + jitter, w, 20 - jitter),
  })
  return {
    id: "1:1",
    name: "hog / Chart",
    type: "COMPONENT",
    absoluteBoundingBox: box(x, y, 1000, 1000),
    absoluteRenderBounds: box(x, y, 1000, 1000),
    children: [part("1:2", eyeX, 200, eyeW), part("1:3", 400, 600, 80)],
  }
}

const unchanged = (a: FigmaNode, b: FigmaNode) =>
  hashNode(a) === hashNode(b) && sameGeometry(nodeGeometry(a), nodeGeometry(b))

describe("node change detection", () => {
  it("ignores where the node sits on the canvas, float noise included", () => {
    // A new hoggie earlier in the alphabetical grid shifts this one by a cell.
    expect(unchanged(hoggie(-9849, 2429), hoggie(-8449, 3829, { jitter: 0.003 }))).toBe(true)
    expect(legacyHashNode(hoggie(-9849, 2429))).not.toBe(legacyHashNode(hoggie(-8449, 3829)))
  })

  it("catches a part moving or resizing by the tolerance", () => {
    const base = hoggie(0, 0)
    expect(unchanged(base, hoggie(0, 0, { eyeX: 100 + GEOMETRY_TOLERANCE_PX + 0.01 }))).toBe(false)
    expect(unchanged(base, hoggie(0, 0, { eyeW: 50 - GEOMETRY_TOLERANCE_PX - 0.01 }))).toBe(false)
    // Moved along with the whole hoggie, still caught.
    expect(unchanged(base, hoggie(500, 500, { eyeX: 103 }))).toBe(false)
  })

  it("catches a non-geometry change exactly", () => {
    const recolored = hoggie(0, 0)
    recolored.children![0]!.fills = [{ type: "SOLID", color: { r: 1, g: 0, b: 0, a: 1 } }]
    expect(unchanged(recolored, hoggie(0, 0))).toBe(false)
  })

  it("treats missing geometry (a pre-geometry sync-state entry) as different", () => {
    expect(sameGeometry(undefined, nodeGeometry(hoggie(0, 0)))).toBe(false)
  })
})
