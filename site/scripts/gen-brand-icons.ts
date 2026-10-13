// Generates the site's favicons and app icons into `site/public/`.
//
// Everything here is drawn from the <Logo> geometry this repo already owns
// (`src/logo/geometry.ts`, the same paths the component renders), through the same renderer
// the build uses for the published `/logo/*` files (`agent/logo-render.ts`). Nothing is
// hand-drawn in an image editor, so re-running this after a logo change reproduces every icon.
// The social card (`og.png`) is the exception: it is a designed illustration, committed
// as-is, and this script does not touch it.
//
// The output is COMMITTED to `site/public/` rather than emitted during `vite build`: these
// files change roughly never, and the dev server needs them too.
//
// Run it with `pnpm gen:site-icons` from the repo root (or `pnpm gen:icons` inside `site/`)
// whenever `src/logo/geometry.ts` changes.

import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { logoArtSvg, rasterizeSvg } from "../agent/logo-render.ts"

const HERE = dirname(fileURLToPath(import.meta.url))
const PUBLIC_DIR = join(HERE, "..", "public")

/** Page background of the site itself (theme.css `--bg-subtle`, PostHog's off-white). */
const OFF_WHITE = "#f4f3ee"

/** The favicon art: the full-color logomark on a square canvas, `pad` × its width wider. */
function iconSvg(pad: number): string {
  // The padding keeps the mark centred with breathing room, which is what an icon needs —
  // the raw logomark is wider than it is tall and would otherwise touch the edges.
  return logoArtSvg({ layout: "logomark", variant: "gradient" }, { pad })
}

/** Square icon: the logomark on a transparent (or given) background. */
function iconPng(
  size: number,
  { pad = 0.28, bg }: { pad?: number; bg?: string } = {},
): Promise<Buffer> {
  return rasterizeSvg(iconSvg(pad), { width: size, height: size }, bg)
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
  out("favicon.svg", iconSvg(0.28))

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
