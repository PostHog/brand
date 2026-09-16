// Generates the site's favicons, app icons, and social-card image into `site/public/`.
//
// Everything here is drawn from assets this repo already owns — the <Logo> geometry
// (`src/logo/geometry.ts`, the same paths the component renders), the brand palette
// (`static/colors.ts`), and a handful of committed hedgehog PNGs (`assets/hoggies/png/`).
// Nothing is hand-drawn in an image editor, so re-running this after a logo or palette
// change reproduces every icon exactly.
//
// The output is COMMITTED to `site/public/` rather than emitted during `vite build`: these
// files change roughly never, the dev server needs them too, and rasterizing them on every
// deploy would make the Cloudflare Pages build depend on `sharp` at runtime.
//
// Run it with `pnpm gen:site-icons` from the repo root (or `pnpm gen:icons` inside `site/`)
// whenever `src/logo/geometry.ts`, the palette, or the picks below change.

import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import sharp from "sharp"
import type { OverlayOptions } from "sharp"
import { colors } from "../../static/colors.ts"
import { LOGO_BODY, LOGO_VIEW_BOX } from "../../src/logo/geometry.ts"

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = join(HERE, "..", "..")
const PUBLIC_DIR = join(HERE, "..", "public")
const HOGGIE_PNG = join(REPO, "assets", "hoggies", "png")

/** Page background of the site itself (theme.css `--bg-subtle`, PostHog's off-white). */
const OFF_WHITE = "#f4f3ee"

/** The hedgehogs standing along the bottom of the social card, left to right. */
const OG_HOGGIES = ["explorer", "star", "party", "superhero", "chart"]

/** Palette order for the social card's swatch row — the logo's own blue → orange → yellow arc. */
const OG_SWATCHES = [
  "blue",
  "cobalt",
  "purple",
  "violet",
  "teal",
  "green",
  "lime",
  "yellow",
  "tangerine",
  "coral",
]

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

/**
 * The 1200×630 social card (`og.png`), composed from the package itself: the full
 * landscape lockup, a row of palette swatches, and a line of hedgehogs standing on a
 * gradient rule. Deliberately typeset-free — the only lettering is the logo's own
 * wordmark geometry, so the card needs no font rasterization and renders identically on
 * any machine. The words come from `og:title` / `og:description`.
 */
async function ogImage(): Promise<Buffer> {
  const W = 1200
  const H = 630
  const layers: OverlayOptions[] = []

  const logo = await raster(logoSvg("landscape", "gradient"), 620, Math.round((620 * 28) / 160))
    .png()
    .toBuffer()
  const logoMeta = await sharp(logo).metadata()
  layers.push({ input: logo, left: Math.round((W - 620) / 2), top: 104 })

  // Palette row — one rounded chip per brand color, centred under the logo.
  const chip = 46
  const gap = 14
  const rowW = OG_SWATCHES.length * chip + (OG_SWATCHES.length - 1) * gap
  const rowX = Math.round((W - rowW) / 2)
  const rowY = 104 + (logoMeta.height ?? 110) + 56
  const chips = OG_SWATCHES.map((slug, i) => {
    const color = colors[slug]
    const [from, to] = color.gradient
    return `<defs><linearGradient id="g${i}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>
      </linearGradient></defs>
      <rect x="${i * (chip + gap)}" y="0" width="${chip}" height="${chip}" rx="${chip / 2}" fill="url(#g${i})"/>`
  }).join("")
  layers.push({
    input: Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${rowW}" height="${chip}">${chips}</svg>`,
    ),
    left: rowX,
    top: rowY,
  })

  // Gradient rule the hedgehogs stand on, flush with the bottom edge.
  const ruleH = 10
  const ruleY = H - ruleH
  const stops = ["blue", "purple", "teal", "yellow", "tangerine"]
    .map((slug, i, all) => {
      const { core } = colors[slug]
      return `<stop offset="${i / (all.length - 1)}" stop-color="${core}"/>`
    })
    .join("")
  layers.push({
    input: Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${ruleH}">
        <defs><linearGradient id="rule" x1="0" y1="0" x2="1" y2="0">${stops}</linearGradient></defs>
        <rect width="${W}" height="${ruleH}" fill="url(#rule)"/>
      </svg>`,
    ),
    left: 0,
    top: ruleY,
  })

  // Hedgehogs, trimmed of their transparent margins so every one sits on the rule at the
  // same visual height regardless of how much padding its source PNG carries.
  const hogH = 214
  const hogs = await Promise.all(
    OG_HOGGIES.map(async (slug) => {
      const buf = await sharp(join(HOGGIE_PNG, `${slug}.png`))
        .trim({ threshold: 1 })
        .resize({ height: hogH })
        .png()
        .toBuffer()
      return { buf, meta: await sharp(buf).metadata() }
    }),
  )
  const hogsW = hogs.reduce((sum, h) => sum + (h.meta.width ?? 0), 0)
  const hogGap = (W - 2 * 64 - hogsW) / (hogs.length - 1)
  let x = 64
  for (const { buf, meta } of hogs) {
    layers.push({ input: buf, left: Math.round(x), top: ruleY + 6 - hogH })
    x += (meta.width ?? 0) + hogGap
  }

  return sharp({ create: { width: W, height: H, channels: 4, background: OFF_WHITE } })
    .composite(layers)
    .png({ compressionLevel: 9, palette: true, colors: 255, dither: 1 })
    .toBuffer()
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

  out("og.png", await ogImage())
}

await main()
