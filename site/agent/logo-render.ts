// Standalone logo SVGs and PNGs, drawn from the same geometry the <Logo> component renders
// (`src/logo/geometry.ts` at the repo root), so `/logo/posthog-logo.svg` is exactly what
// `<Logo />` puts on the page. Shared by the build, which renders the logo files in
// `src/logo-files.ts`, and `scripts/gen-brand-icons.ts`, which renders the site's favicons.

import type { LogoLayout, LogoVariant } from "@posthog/brand/logo"
import sharp from "sharp"
import { LOGO_BODY, LOGO_VIEW_BOX } from "../../src/logo/geometry.ts"
import { type LogoFile, logoProps } from "../src/logo-files.ts"
import { type ExportFrame, frameSide } from "../src/svg-export.ts"

/** What to draw: one lockup in one color treatment (`color` fills mono artwork). */
export interface LogoArt {
  layout: LogoLayout
  variant: LogoVariant
  color?: string
}

/**
 * The canvas around the lockup, in viewBox units: its own box by default, a Logo-page avatar
 * `frame` (the same math the page exports with), or a square `pad` × the long side wider (the
 * favicons' breathing room).
 */
export interface LogoCanvas {
  frame?: ExportFrame
  pad?: number
}

/** A rectangle in viewBox units. */
interface Box {
  x: number
  y: number
  width: number
  height: number
}

/** Pixel dimensions. */
export interface Size {
  width: number
  height: number
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}

function canvasBox(layout: LogoLayout, { frame, pad }: LogoCanvas): Box {
  const [x = 0, y = 0, width = 0, height = 0] = LOGO_VIEW_BOX[layout].split(" ").map(Number)
  const side = frame
    ? frameSide(width, height, frame)
    : pad
      ? Math.max(width, height) * (1 + pad)
      : undefined
  if (side === undefined) return { x, y, width, height }
  return { x: x - (side - width) / 2, y: y - (side - height) / 2, width: side, height: side }
}

/** A standalone SVG of the lockup, centred on its canvas, with an intrinsic size. */
export function logoArtSvg({ layout, variant, color }: LogoArt, canvas: LogoCanvas = {}): string {
  const body = LOGO_BODY[layout][variant]
  // Mono artwork draws in `currentColor`; a standalone file has no CSS to supply it.
  const markup = color ? body.replaceAll("currentColor", color) : body
  const { x, y, width, height } = canvasBox(layout, canvas)
  const viewBox = [x, y, width, height].map(round).join(" ")
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${round(width)}" height="${round(height)}">${markup}</svg>`
}

/**
 * Rasterizes standalone SVG markup to a PNG of exactly `width` × `height` (contained,
 * transparent margins), optionally on an opaque `background` plate. Rendered at a high density
 * so curves are drawn at (at least) the target size rather than upscaled.
 */
export async function rasterizeSvg(
  svg: string,
  { width, height }: Size,
  background?: string,
): Promise<Buffer> {
  const intrinsicWidth = Number(/ width="([\d.]+)"/.exec(svg)?.[1] ?? width)
  const density = Math.max(1200, Math.ceil((72 * width) / intrinsicWidth))
  const art = await sharp(Buffer.from(svg), { density })
    .resize(width, height, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    // Full color, not palette-quantized: a 256-color palette bands the brand gradients.
    .png({ compressionLevel: 9 })
    .toBuffer()
  if (!background) return art
  return sharp({ create: { width, height, channels: 4, background } })
    .composite([{ input: art }])
    .png({ compressionLevel: 9 })
    .toBuffer()
}

// ---- The published logo files (src/logo-files.ts) ----------------------------------------

/** Long side of every logo file's PNG, in px — big enough for slides and print-ish use. */
const LOGO_PNG_LONG_SIDE = 1600

function fileArt(file: LogoFile): LogoArt {
  return { layout: file.layout, ...logoProps(file.treatment) }
}

export function logoSvg(file: LogoFile): string {
  return logoArtSvg(fileArt(file), { frame: file.frame })
}

/** Pixel size of the file's PNG: {@link LOGO_PNG_LONG_SIDE} on the long side. */
export function logoPngSize(file: LogoFile): Size {
  const { width, height } = canvasBox(file.layout, { frame: file.frame })
  const scale = LOGO_PNG_LONG_SIDE / Math.max(width, height)
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

export function logoPng(file: LogoFile): Promise<Buffer> {
  return rasterizeSvg(logoSvg(file), logoPngSize(file))
}
