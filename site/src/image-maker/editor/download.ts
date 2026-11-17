import posthog from "posthog-js"
import { imagesReady } from "./canvas.ts"

export interface PngRequest {
  /** The drawing's own size; `scale` multiplies it for the file. */
  width: number
  height: number
  scale?: number
  filename: string
  /** Every image the drawing uses, so the file never goes out with a hole in it. */
  images?: (string | undefined | null)[]
  draw: (ctx: CanvasRenderingContext2D) => void
}

function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob(resolve, "image/png")
    } catch {
      resolve(null) // a tainted canvas
    }
  })
}

function saveBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/** Draws at full size and downloads the PNG. Rejects if the browser can't make the file. */
export async function downloadPng(maker: string, req: PngRequest): Promise<void> {
  await imagesReady(req.images ?? [])
  const scale = req.scale ?? 1
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(req.width * scale)
  canvas.height = Math.round(req.height * scale)
  const ctx = canvas.getContext("2d")!
  ctx.scale(scale, scale)
  req.draw(ctx)
  const blob = await canvasBlob(canvas)
  if (!blob) throw new Error("render")
  saveBlob(req.filename, blob)
  posthog.capture("image downloaded", { format: maker, filename: req.filename })
}
