// Generates the site's favicons and app icons into `site/public/`.
//
// Everything here is drawn from the <Logo> geometry this repo already owns
// (`src/logo/geometry.ts`, the same paths the component renders). Nothing is hand-drawn in
// an image editor, so re-running this after a logo change reproduces every icon exactly.
// The social card (`og.png`) is the exception: it is a designed illustration, committed
// as-is, and this script does not touch it.
//
// The output is COMMITTED to `site/public/` rather than emitted during `vite build`: these
// files change roughly never, the dev server needs them too, and rasterizing them on every
// deploy would make the Cloudflare Pages build depend on `sharp` at runtime.
//
// Run it with `pnpm gen:site-icons` from the repo root (or `pnpm gen:icons` inside `site/`)
// whenever `src/logo/geometry.ts` changes.

import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import sharp from "sharp"
import { LOGO_BODY, LOGO_VIEW_BOX } from "../../src/logo/geometry.ts"

const HERE = dirname(fileURLToPath(import.meta.url))
const PUBLIC_DIR = join(HERE, "..", "public")

/** Page background of the site itself (theme.css `--bg-subtle`, PostHog's off-white). */
const OFF_WHITE = "#f4f3ee"

/** Wrap one lockup's inner markup (which already carries its own `<defs>`) as a standalone SVG. */
function logoSvg(
  layout: keyof typeof LOGO_BODY,
  variant: "gradient" | "print" | "mono",
  { pad = 0 }: { pad?: number } = {},
): string {
  const [x, y, w, h] = LOGO_VIEW_BOX[layout].split(" ").map(Number)
  // A padded square viewBox keeps the mark centred with breathing room, which is what an
  // icon needs — the raw lockup is wider than it is tall and would otherwise touch the edges.
  const side = Math.max(w, h) * (1 + pad)
  const box = pad
    ? `${x - (side - w) / 2} ${y - (side - h) / 2} ${side} ${side}`
    : LOGO_VIEW_BOX[layout]
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box}">${LOGO_BODY[layout][variant]}</svg>`
}

/** Rasterize an SVG string at a generous density so curves stay clean at small sizes. */
function raster(svg: string, width: number, height = width) {
  return sharp(Buffer.from(svg), { density: 1200 }).resize(width, height, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
}

/** Square icon: the logomark on a transparent (or given) background. */
async function iconPng(size: number, { pad = 0.28, bg }: { pad?: number; bg?: string } = {}) {
  const mark = await raster(logoSvg("logomark", "gradient", { pad }), size)
    .png()
    .toBuffer()
  if (!bg) return mark
  return sharp({ create: { width: size, height: size, channels: 4, background: bg } })
    .composite([{ input: mark }])
    .png({ compressionLevel: 9 })
    .toBuffer()
}

/**
 * Pack PNGs into a classic `.ico`. Windows/legacy crawlers still ask for `/favicon.ico`,
 * and an ICO may embed PNG frames verbatim (Vista+), so this is just a header plus a
 * directory entry per size — no BMP re-encoding.
 */
function ico(frames: { size: number; png: Buffer }[]): Buffer {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(frames.length, 4)

  let offset = 6 + frames.length * 16
  const dir: Buffer[] = []
  for (const { size, png } of frames) {
    const entry = Buffer.alloc(16)
    entry.writeUInt8(size >= 256 ? 0 : size, 0) // 0 means 256
    entry.writeUInt8(size >= 256 ? 0 : size, 1)
    entry.writeUInt8(0, 2) // palette size
    entry.writeUInt8(0, 3) // reserved
    entry.writeUInt16LE(1, 4) // color planes
    entry.writeUInt16LE(32, 6) // bits per pixel
    entry.writeUInt32LE(png.length, 8)
    entry.writeUInt32LE(offset, 12)
    dir.push(entry)
    offset += png.length
  }
  return Buffer.concat([header, ...dir, ...frames.map((f) => f.png)])
}

async function main(): Promise<void> {
  mkdirSync(PUBLIC_DIR, { recursive: true })
  const out = (name: string, data: Buffer | string) => {
    writeFileSync(join(PUBLIC_DIR, name), data)
    const kb = (Buffer.byteLength(data as Buffer) / 1024).toFixed(1)
    console.log(`  ${name.padEnd(28)} ${kb.padStart(7)} KB`)
  }

  console.log("Generating site icons from the brand package…")

  // Vector favicon first: it is what modern browsers actually use, and it stays crisp on
  // any display. The padded viewBox matches the raster icons so they look like one set.
  out("favicon.svg", logoSvg("logomark", "gradient", { pad: 0.28 }))

  out(
    "favicon.ico",
    ico(
      await Promise.all(
        [16, 32, 48].map(async (size) => ({ size, png: await iconPng(size, { pad: 0.16 }) })),
      ),
    ),
  )
  // Google's crawler wants a raster favicon that is a multiple of 48px.
  out("favicon-96x96.png", await iconPng(96, { pad: 0.2 }))

  // iOS ignores transparency and composites app icons on black, so this one gets the
  // site's own off-white plate and a little more padding for the rounded-corner mask.
  out("apple-touch-icon.png", await iconPng(180, { pad: 0.42, bg: OFF_WHITE }))

  // PWA / Android install icons named in site.webmanifest. The maskable one keeps the
  // mark inside the 80% safe zone so a circular mask never clips it.
  out("icon-192.png", await iconPng(192, { pad: 0.28, bg: OFF_WHITE }))
  out("icon-512.png", await iconPng(512, { pad: 0.28, bg: OFF_WHITE }))
  out("icon-maskable-512.png", await iconPng(512, { pad: 0.45, bg: OFF_WHITE }))
}

await main()
