// Renders the logo files in `src/logo-files.ts` to standalone SVG and PNG at build time.
//
// Drawn from the same geometry the <Logo> component renders (`src/logo/geometry.ts` at the
// repo root, as `scripts/gen-brand-icons.ts` does), so `/logo/posthog-logo.svg` is exactly
// what `<Logo />` puts on the page. The padded square/circle avatars reuse the Logo page's own
// frame math (`frameSide`), so a downloaded avatar matches the one copied from the page.

import sharp from "sharp"
import { LOGO_BODY, LOGO_VIEW_BOX } from "../../src/logo/geometry.ts"
import { type LogoFile, logoProps } from "../src/logo-files.ts"
import { frameSide } from "../src/svg-export.ts"

/** Long side of every logo PNG, in px — big enough for slides and print-ish use. */
const LOGO_PNG_LONG_SIDE = 1600

const round = (n: number) => Math.round(n * 100) / 100

/** The file's canvas in viewBox units: the lockup's own box, grown to the padded frame. */
function canvas(file: LogoFile): { x: number; y: number; width: number; height: number } {
  const [x = 0, y = 0, width = 0, height = 0] = LOGO_VIEW_BOX[file.layout].split(" ").map(Number)
  if (!file.frame) return { x, y, width, height }
  const side = frameSide(width, height, file.frame)
  return { x: x - (side - width) / 2, y: y - (side - height) / 2, width: side, height: side }
}

export function logoSvg(file: LogoFile): string {
  const { variant, color } = logoProps(file.treatment)
  const body = LOGO_BODY[file.layout][variant]
  // Mono artwork draws in `currentColor`; a standalone file has no CSS to supply it.
  const markup = color ? body.replaceAll("currentColor", color) : body
  const { x, y, width, height } = canvas(file)
  const viewBox = [x, y, width, height].map(round).join(" ")
  return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="${viewBox}" width="${round(width)}" height="${round(height)}">${markup}</svg>`
}

/** Pixel size of the file's PNG: {@link LOGO_PNG_LONG_SIDE} on the long side. */
export function logoPngSize(file: LogoFile): { width: number; height: number } {
  const { width, height } = canvas(file)
  const scale = LOGO_PNG_LONG_SIDE / Math.max(width, height)
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

export async function logoPng(file: LogoFile): Promise<Buffer> {
  const { width, height } = logoPngSize(file)
  const { width: units } = canvas(file)
  // Rasterize at (at least) the target size so curves are drawn, not upscaled.
  const density = Math.ceil((72 * width) / units)
  return (
    sharp(Buffer.from(logoSvg(file)), { density })
      .resize(width, height, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      // Full color, not palette-quantized: a 256-color palette bands the brand gradients.
      .png({ compressionLevel: 9 })
      .toBuffer()
  )
}
