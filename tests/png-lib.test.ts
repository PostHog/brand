import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { optimizePng } from "../scripts/lib/png.ts"

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

// A real committed asset to exercise the pngquant + oxipng pipeline against.
const FIXTURE = join(import.meta.dirname, "..", "assets", "crests", "full", "png", "ai-gateway.png")

describe("optimizePng", () => {
  it("keeps a real PNG valid and never larger (idempotent on optimized assets)", async () => {
    const original = readFileSync(FIXTURE)
    const optimized = Buffer.from(await optimizePng(original))

    // Committed assets are already optimized, so this proves the never-grow invariant
    // rather than fresh shrinkage; the byte-for-byte reduction is exercised by `pnpm sync`.
    expect(optimized.byteLength).toBeLessThanOrEqual(original.byteLength)
    // Still a standard PNG → renders in any browser.
    expect(optimized.subarray(0, 8).equals(PNG_SIGNATURE)).toBe(true)
  })

  it("never grows the file: incompressible input falls back to the original", async () => {
    // A tiny non-PNG buffer can't be quantized or losslessly improved.
    const tiny = new Uint8Array([1, 2, 3, 4])
    const out = await optimizePng(tiny)
    expect(out.byteLength).toBeLessThanOrEqual(tiny.byteLength)
  })
})
