// PNG optimization shared by sync and its tests.
//
// Figma renders weakly-compressed PNGs. We shrink them with lossy palette quantization
// (pngquant) followed by a lossless recompress (oxipng). The output is still a standard
// PNG, so it renders in every browser; we just throw away redundant bytes.

import { losslessCompressPng, pngQuantize } from "@napi-rs/image"

/**
 * Optimize a Figma-rendered PNG: lossy palette quantization (pngquant) then a lossless
 * recompress (oxipng). The result is a standard PNG with universal browser support. Both
 * passes are guarded so a single uncompressible asset never aborts a sync, and the final
 * size comparison guarantees we never ship a file larger than Figma gave us.
 */
export async function optimizePng(input: Uint8Array): Promise<Uint8Array> {
  const original = Buffer.from(input)

  let candidate: Buffer = original
  try {
    // minQuality 0 => pngquant never errors on hard-to-quantize images; maxQuality caps
    // perceptible loss for the flat-color illustrations and crests we render.
    candidate = await pngQuantize(original, { minQuality: 0, maxQuality: 95, speed: 1 })
  } catch {
    // Quantization unusable for this image — keep the original for the lossless pass.
  }

  let compressed: Buffer = candidate
  try {
    compressed = await losslessCompressPng(candidate)
  } catch {
    // Lossless pass failed — fall back to whatever we already have.
  }

  return compressed.byteLength < original.byteLength ? compressed : original
}
