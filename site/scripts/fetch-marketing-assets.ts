// Renders the marketing assets (`src/marketing-assets.ts`) from the brand book in Figma into
// `site/public/marketing-assets/`: each frame (one per image and format) as a full-resolution PNG
// (losslessly recompressed), plus the smaller WebP preview of each image's first format that the
// Marketing assets page shows.
//
// The output is COMMITTED: it's designed raster art, so a deploy can't re-make it, and the dev
// server needs it too. Re-run this when the Figma page changes, or after adding an image to the
// table:
//
//   FIGMA_TOKEN=… pnpm fetch:marketing-assets        (from the repo root)
//
// It needs a Figma personal access token that can read the brand book. It makes one `/images`
// call per render scale; downloading the rendered files doesn't count against the rate limit.

import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { losslessCompressPng } from "@napi-rs/image"
import sharp from "sharp"
import {
  MARKETING_FIGMA_FILE,
  MARKETING_ASSET_GROUPS,
  marketingAssetFiles,
  marketingPreviewPath,
} from "../src/marketing-assets.ts"

const HERE = dirname(fileURLToPath(import.meta.url))
const PUBLIC_DIR = join(HERE, "..", "public")

const token = process.env.FIGMA_TOKEN
if (!token) {
  console.error("fetch-marketing-assets: set FIGMA_TOKEN to a Figma personal access token")
  process.exit(1)
}

async function figma<T>(path: string): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`https://api.figma.com/v1${path}`, {
      headers: { "X-Figma-Token": token! },
    })
    if (res.ok) return (await res.json()) as T
    if ((res.status === 429 || res.status >= 500) && attempt < 4) {
      const wait = Number(res.headers.get("retry-after")) || 5 * 2 ** attempt
      console.warn(`  Figma ${res.status}, retrying in ${wait}s`)
      await new Promise((resolve) => setTimeout(resolve, wait * 1000))
      continue
    }
    throw new Error(`Figma ${res.status} for ${path}: ${await res.text()}`)
  }
}

// The rendered files are a few MB each from S3, which now and then drops the connection mid-file.
// Downloads are free (not rate limited), so just try again.
async function download(url: string): Promise<Buffer> {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`download ${res.status}: ${url}`)
      return Buffer.from(await res.arrayBuffer())
    } catch (error) {
      if (attempt >= 3) throw error
      console.warn(`  download failed (${(error as Error).message}), retrying`)
      await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)))
    }
  }
}

function write(sitePath: string, data: Uint8Array) {
  const target = join(PUBLIC_DIR, sitePath)
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, data)
}

for (const group of MARKETING_ASSET_GROUPS) {
  for (const image of group.images) {
    if (image.figmaNodes.length !== group.formats.length) {
      throw new Error(
        `${image.id} lists ${image.figmaNodes.length} Figma frames, but ${group.id} has ${group.formats.length} formats`,
      )
    }
  }
  const ids = group.images.flatMap((image) => image.figmaNodes).join(",")
  // `use_absolute_bounds` renders exactly the frame, never a shadow or overflow past its edge.
  const { images: urls } = await figma<{ images: Record<string, string | null> }>(
    `/images/${MARKETING_FIGMA_FILE}?ids=${encodeURIComponent(ids)}&format=png&scale=${group.scale}&use_absolute_bounds=true`,
  )

  for (const image of group.images) {
    for (const [index, file] of marketingAssetFiles(image, group).entries()) {
      const label = `${image.id}${file.ratio ? ` ${file.ratio}` : ""}`
      const url = urls[file.figmaNode]
      if (!url) throw new Error(`Figma rendered nothing for ${label} (${file.figmaNode})`)
      const rendered = await download(url)

      const { width, height } = await sharp(rendered).metadata()
      if (width !== file.width || height !== file.height) {
        throw new Error(
          `${label} rendered at ${width}×${height}, expected ${file.width}×${file.height}: did the frame change size? Update its group in src/marketing-assets.ts.`,
        )
      }

      // Lossless only: the garden scene and gradients would band under palette quantization.
      const png = await losslessCompressPng(rendered)
      const best = png.byteLength < rendered.byteLength ? png : rendered
      write(file.path, best)
      let line = `  ${label}: ${width}×${height} PNG ${(best.byteLength / 1e6).toFixed(1)} MB`

      if (index === 0) {
        const preview = await sharp(rendered)
          .resize({ width: group.previewWidth })
          .webp({ quality: 82 })
          .toBuffer()
        write(marketingPreviewPath(image.id), preview)
        line += `, preview ${(preview.byteLength / 1e3).toFixed(0)} KB`
      }
      console.log(line)
    }
  }
}
