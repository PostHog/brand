// Draws an event image in its own 1080 × 1080 units: the headline (Squeak Bold), the calendar tile,
// the details, the hoggie and/or your picture, and the footer with the PostHog and partner logos.

import {
  BOLD,
  type Rect,
  SEMIBOLD,
  fontStr,
  loadedImage,
  roundRect,
  setLetterSpacing,
} from "../../editor/canvas.ts"
import { makerHoggies } from "../../hoggies.ts"
import {
  ASSETS,
  DAYS,
  type EventDoc,
  MONTHS,
  footSwatch,
  hasPhoto,
  parseDate,
  swatch,
  timeLine,
} from "./model.ts"

export const SIZE = 1080
/** The footer starts here; the hoggie can't be clicked below it. */
export const FOOTER_TOP = 930
/** Shown, faded, where the hoggie goes until one is chosen. */
const PLACEHOLDER_HOG = "Sitting"
const HEAD_FONT = '"Squeak", "RoundHog", system-ui, sans-serif'
/** Squeak only has a bold face. */
const HEAD_WEIGHT = 700

export function hogUrl(name: string): string {
  return makerHoggies()[name]?.id ?? ""
}

let squeakAdded = false
/** Registers Squeak Bold (the site doesn't), once. `requestFonts` then loads it. */
export function addSqueak() {
  if (squeakAdded) return
  squeakAdded = true
  document.fonts.add(
    new FontFace("Squeak", `url(${ASSETS.squeak}) format('woff2')`, {
      weight: String(HEAD_WEIGHT),
      style: "normal",
    }),
  )
}

// ---- Text ----

let measureCtx: CanvasRenderingContext2D | null = null
function mctx(): CanvasRenderingContext2D {
  measureCtx ??= document.createElement("canvas").getContext("2d")!
  return measureCtx
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number, maxLines: number) {
  const words = String(text).split(/\s+/).filter(Boolean)
  let lines: string[] = []
  let cur = ""
  for (const w of words) {
    const n = cur ? `${cur} ${w}` : w
    if (cur && ctx.measureText(n).width > maxW) {
      lines.push(cur)
      cur = w
    } else cur = n
  }
  if (cur) lines.push(cur)
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines)
    lines[maxLines - 1] += "…"
  }
  return lines
}

/** Location: each typed line wraps to the text width; 4 lines at most. */
function locationLines(ctx: CanvasRenderingContext2D, d: EventDoc): string[] {
  ctx.font = fontStr(SEMIBOLD, 40)
  let out: string[] = []
  for (const para of String(d.location || "")
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean))
    out.push(...wrapText(ctx, para, 904, 4))
  if (out.length > 4) {
    out = out.slice(0, 4)
    out[3] += "…"
  }
  return out
}

// Words between ** stay bold; when any are marked, the rest are drawn lighter (faded) and smaller.
const LIGHT_SCALE = 0.78
const LIGHT_ALPHA = 0.6

interface Word {
  t: string
  /** Bold. */
  b: boolean
  /** Glued to the previous word (no space between). */
  join?: boolean
  /** A space follows. */
  sp?: boolean
}

/** The headline as lines of words. */
function headlineWords(raw: string): Word[][] {
  let bold = !raw.includes("**")
  const lines: Word[][] = [[]]
  for (const tok of raw.split(/(\*\*|\n|\|)/)) {
    if (tok === "**") {
      bold = !bold
      continue
    }
    if (tok === "\n" || tok === "|") {
      lines.push([])
      continue
    }
    const line = lines[lines.length - 1]!
    for (const w of tok.split(/(\s+)/)) {
      if (!w) continue
      if (/^\s+$/.test(w)) {
        if (line.length) line[line.length - 1]!.sp = true
        continue
      }
      const prev = line[line.length - 1]
      if (prev && !prev.sp) line.push({ t: w, b: bold, join: true })
      else line.push({ t: w, b: bold })
    }
  }
  return lines
    .filter((l) => l.length)
    .map((l) => {
      l[l.length - 1]!.sp = false
      return l
    })
}

function wordsWidth(ctx: CanvasRenderingContext2D, words: Word[]): number {
  let w = 0
  const space = ctx.measureText(" ").width
  words.forEach((x, i) => {
    const k = x.b ? 1 : LIGHT_SCALE
    if (i > 0 && !x.join) w += space * (x.b ? 1 : LIGHT_SCALE)
    w += ctx.measureText(x.t).width * k
  })
  return w
}

interface SizedLine {
  text: Word[]
  size: number
}

/** The tallest word drawn on a line sets its height, so a line of only light words isn't spaced as if it were bold. */
function lineSize(l: SizedLine): number {
  return l.text.some((w) => w.b) ? l.size : l.size * LIGHT_SCALE
}

function headlineLines(d: EventDoc, maxH: number): SizedLine[] {
  const colW = 680
  const base = 100
  const scale = Math.min(150, Math.max(60, +d.hlScale || 100)) / 100
  let lines = headlineWords(String(d.title || "").toUpperCase())
  const ctx = mctx()
  ctx.font = fontStr(HEAD_WEIGHT, base, HEAD_FONT)
  setLetterSpacing(ctx, -1)
  // One long line wraps to the column first.
  if (lines.length === 1 && wordsWidth(ctx, lines[0]!) > colW) {
    let cur: Word[] = []
    const out: Word[][] = []
    for (const w of lines[0]!) {
      const n = [...cur, w]
      if (cur.length && !w.join && wordsWidth(ctx, n) > colW) {
        out.push(cur)
        cur = [w]
      } else cur = n
    }
    if (cur.length) out.push(cur)
    lines = out.map((l) => {
      const c = l.map((x) => ({ t: x.t, b: x.b, join: x.join }))
      c[0]!.join = false
      return c
    })
  }
  const fit = d.headline !== "even"
  const sized: SizedLine[] = lines.map((t) => {
    const w = wordsWidth(ctx, t) || 1
    const target = Math.floor((base * colW * 0.98) / w)
    return {
      text: t,
      size: fit ? Math.max(56, Math.min(200, target)) : Math.min(base, Math.max(56, target)),
    }
  })
  // Size slider, then keep every line inside its width: beside the calendar 680, below it 904.
  let yy = 80
  for (const l of sized) {
    const wBase = wordsWidth(ctx, l.text) || 1
    l.size = Math.round(l.size * scale)
    const maxW = yy < 284 ? colW : 904 // beside the calendar (80 + 188 tall + gap)
    const w = (wBase * l.size) / base
    if (w > maxW) l.size = Math.floor((l.size * maxW) / w)
    yy += lineSize(l) * 0.95
  }
  const total = sized.reduce((s, l) => s + lineSize(l) * 0.95, 0)
  const cap = maxH || 440
  if (total > cap) {
    const k = cap / total
    for (const l of sized) l.size = Math.floor(l.size * k)
  }
  return sized
}

// ---- Pictures ----

interface Sized {
  img: CanvasImageSource
  w: number
  h: number
}

function sized(im: HTMLImageElement): Sized {
  return { img: im, w: im.naturalWidth, h: im.naturalHeight }
}

function containRect(im: Sized, bx: number, by: number, bw: number, bh: number, bottom: boolean) {
  const k = Math.min(bw / im.w, bh / im.h)
  const w = im.w * k
  const h = im.h * k
  return { x: bx + (bw - w) / 2, y: bottom ? by + bh - h : by + (bh - h) / 2, w, h }
}

const silhouettes = new Map<string, Sized>()
/** The image filled with one color, keeping its alpha. */
function silhouette(im: HTMLImageElement, color: string): Sized {
  const key = im.src + color
  const hit = silhouettes.get(key)
  if (hit) return hit
  const c = document.createElement("canvas")
  c.width = im.naturalWidth || 720
  c.height = im.naturalHeight || 720
  const x = c.getContext("2d")!
  x.drawImage(im, 0, 0, c.width, c.height)
  x.globalCompositeOperation = "source-in"
  x.fillStyle = color
  x.fillRect(0, 0, c.width, c.height)
  const out = { img: c, w: c.width, h: c.height }
  silhouettes.set(key, out)
  return out
}

/** Every image a drawing can use, so a download can wait for them. */
export function imagesOf(d: EventDoc): string[] {
  return [
    ASSETS.logos.white,
    ASSETS.logos.black,
    d.hog ? hogUrl(d.hog) : "",
    hasPhoto(d) ? d.photo.id : "",
    ...(d.logos ?? []).slice(0, 4).map((l) => l.id),
  ].filter(Boolean)
}

/**
 * Draws the image. `editor` adds the stage-only "Choose hoggie" placeholder. Returns the
 * hoggie's rectangle (or the placeholder's) so the stage can make it clickable.
 */
export function drawPost(ctx: CanvasRenderingContext2D, d: EventDoc, editor = false): Rect | null {
  const bg = swatch(d.bg, 500)
  const cal = swatch(d.cal, 700)
  const foot = footSwatch(d.footer)
  const lightText = !d.darkText // white text by default; "Dark text" switches it
  const fg = lightText ? "#ffffff" : "#1e1f23"
  const fgMuted = lightText ? "rgba(255,255,255,0.5)" : "rgba(30,31,35,0.5)"
  ctx.save()
  ctx.fillStyle = bg.css
  ctx.fillRect(0, 0, SIZE, SIZE)
  ctx.textBaseline = "alphabetic"
  ctx.textAlign = "left"

  // Headline: as big as the space above the details allows
  const tl = timeLine(d)
  const loc = locationLines(ctx, d)
  const detailsH = 55 + 12 + (tl ? 48 : 0) + 40 + 6 + 40 + 48 * loc.length
  const maxHead = FOOTER_TOP - 40 - 80 - 56 - detailsH
  let y = 80
  ctx.fillStyle = fg
  ctx.save()
  if (d.glow && lightText) {
    const unit = Math.abs(ctx.getTransform().a) // shadow blur ignores the canvas scale
    ctx.shadowColor = "rgba(255,255,255,0.55)"
    ctx.shadowBlur = 10 * unit
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
  }
  for (const l of headlineLines(d, maxHead)) {
    const lh = lineSize(l) * 0.95
    let x = 88
    const by = y + lh * 0.83
    l.text.forEach((w, i) => {
      const sz = w.b ? l.size : l.size * LIGHT_SCALE
      ctx.font = fontStr(HEAD_WEIGHT, sz, HEAD_FONT)
      setLetterSpacing(ctx, -0.01 * sz)
      if (i > 0 && !w.join) x += ctx.measureText(" ").width
      ctx.globalAlpha = w.b ? 1 : LIGHT_ALPHA
      ctx.fillText(w.t, x, by)
      x += ctx.measureText(w.t).width
    })
    ctx.globalAlpha = 1
    y += lh
  }
  ctx.restore()
  setLetterSpacing(ctx, 0)

  // Calendar: 176 wide; 76px month strip, 112px day area; 8px corners; 1px #D9D9D9 stroke;
  // shadow X 0 Y 10 blur 3 #000 25% (from the Figma template)
  const dt = parseDate(d.date)
  const cx = 816
  const cy = 80
  const cw = 176
  const strip = 76
  const ch = strip + 112
  const rad = 8
  const u = Math.abs(ctx.getTransform().a) // shadows ignore the canvas scale
  ctx.save()
  ctx.shadowColor = "rgba(0,0,0,0.25)"
  ctx.shadowBlur = 3 * u
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 10 * u
  roundRect(ctx, cx, cy, cw, ch, rad)
  ctx.fillStyle = "#ffffff"
  ctx.fill()
  ctx.restore()
  ctx.save()
  roundRect(ctx, cx, cy, cw, ch, rad)
  ctx.clip()
  ctx.fillStyle = cal.css
  ctx.fillRect(cx, cy, cw, strip)
  ctx.restore()
  roundRect(ctx, cx + 0.5, cy + 0.5, cw - 1, ch - 1, rad)
  ctx.strokeStyle = "#D9D9D9"
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.textAlign = "center"
  const monthLight = d.calFlip ? !lightText : lightText // "Flip month text" sets the month opposite to the rest of the text
  ctx.fillStyle = monthLight ? "#ffffff" : "#1e1f23"
  ctx.font = fontStr(BOLD, 48)
  setLetterSpacing(ctx, 3)
  ctx.fillText(
    dt ? MONTHS[dt.getMonth()]!.slice(0, 3).toUpperCase() : "MMM",
    cx + cw / 2 + 1.5,
    cy + strip / 2 + 17,
  )
  setLetterSpacing(ctx, 0)
  ctx.fillStyle = "#394150"
  ctx.font = fontStr(BOLD, 84)
  ctx.fillText(dt ? String(dt.getDate()) : "DD", cx + cw / 2, cy + strip + 86)
  ctx.textAlign = "left"

  // Details
  y += 56
  ctx.fillStyle = fg
  ctx.font = fontStr(SEMIBOLD, 48)
  ctx.fillText(
    dt ? `${DAYS[dt.getDay()]}, ${MONTHS[dt.getMonth()]} ${dt.getDate()}` : "Day, Month DD",
    88,
    y + 42,
  )
  y += 55 + 12
  if (tl) {
    ctx.fillStyle = fgMuted
    ctx.font = fontStr(SEMIBOLD, 40)
    ctx.fillText(tl, 88, y + 36)
    y += 48
  }
  y += 40
  ctx.fillStyle = fg
  roundRect(ctx, 88, y, 100, 6, 3)
  ctx.fill()
  y += 6 + 40
  ctx.font = fontStr(SEMIBOLD, 40)
  for (const line of loc) {
    ctx.fillText(line, 88, y + 36)
    y += 48
  }

  // Hoggie (above the text, below the footer)
  let hit: Rect | null = null
  const hsize = Math.min(200, Math.max(50, +d.hogSize || 100)) / 100
  const htx = Math.max(-50, Math.min(50, +d.hogX || 0)) * 10.8
  const hty = -Math.max(-50, Math.min(50, +d.hogY || 0)) * 10.8
  const ox = 720 // bottom centre of the 720px hoggie box (right 0, bottom 30)
  const oy = 1050
  const placed = (
    im: Sized,
    o: { size?: number; tx?: number; ty?: number; flip?: boolean } = {},
  ): Rect => {
    const size = o.size ?? hsize
    const tx = o.tx ?? htx
    const ty = o.ty ?? hty
    const flip = o.flip ?? d.flip
    const r = containRect(im, 360, 330, 720, 720, true)
    ctx.save()
    ctx.translate(ox + tx, oy + ty)
    ctx.scale(flip ? -size : size, size)
    ctx.translate(-ox, -oy)
    ctx.drawImage(im.img, r.x, r.y, r.w, r.h)
    ctx.restore()
    const x1 = ox + tx + (r.x - ox) * size
    const x2 = ox + tx + (r.x + r.w - ox) * size
    return {
      x: Math.min(x1, x2),
      y: oy + ty + (r.y - oy) * size,
      w: Math.abs(x2 - x1),
      h: r.h * size,
    }
  }
  // Your image: same box as the hoggie, with its own size / move / flip; drawn behind or in front.
  const ph = hasPhoto(d) ? d.photo : null
  const photoIm = ph ? loadedImage(ph.id) : null
  const drawPhoto = () => {
    if (!ph || !photoIm) return
    placed(sized(photoIm), {
      size: Math.min(200, Math.max(20, +ph.size || 100)) / 100,
      tx: Math.max(-60, Math.min(60, +ph.x || 0)) * 10.8,
      ty: -Math.max(-60, Math.min(60, +ph.y || 0)) * 10.8,
      flip: !!ph.flip,
    })
  }
  if (ph && !ph.front) drawPhoto()
  const hogIm = d.hog ? loadedImage(hogUrl(d.hog)) : null
  if (hogIm) hit = placed(sized(hogIm))
  else if (editor && !ph) {
    const sit = loadedImage(hogUrl(PLACEHOLDER_HOG))
    if (sit) {
      hit = placed(silhouette(sit, bg.light ? "rgba(255,255,255,0.35)" : "rgba(30,31,35,0.28)"))
    } else {
      hit = { x: 600, y: 520, w: 360, h: 400 }
      ctx.save()
      ctx.setLineDash([14, 10])
      ctx.lineWidth = 4
      ctx.strokeStyle = fgMuted
      roundRect(ctx, hit.x, hit.y, hit.w, hit.h, 24)
      ctx.stroke()
      ctx.restore()
    }
    // "Choose hoggie" pill
    const label = "Choose hoggie"
    ctx.font = fontStr(BOLD, 30)
    const pw = ctx.measureText(label).width + 56
    const phh = 64
    const px = Math.min(SIZE - pw - 24, Math.max(24, hit.x + hit.w / 2 - pw / 2))
    const py = Math.min(FOOTER_TOP - phh - 24, hit.y + hit.h * 0.45)
    ctx.fillStyle = fg
    roundRect(ctx, px, py, pw, phh, 32)
    ctx.fill()
    ctx.fillStyle = bg.css
    ctx.textAlign = "center"
    ctx.fillText(label, px + pw / 2, py + 42)
    ctx.textAlign = "left"
  }
  if (ph?.front) drawPhoto()

  // Footer
  ctx.fillStyle = foot.css
  ctx.fillRect(0, FOOTER_TOP, SIZE, SIZE - FOOTER_TOP)
  const logoWhite = d.logoColor === "white" ? true : d.logoColor === "black" ? false : foot.light
  const logoIm = loadedImage(logoWhite ? ASSETS.logos.white : ASSETS.logos.black)
  const parts: Sized[] = []
  const logos = d.logos ?? []
  const n = Math.min(4, logos.length)
  const gap = n > 1 ? 40 : 56
  const slotW = n ? Math.min(280, Math.floor((904 - 230 - gap * n) / n)) : 0
  if (logoIm)
    parts.push({ img: logoIm, w: (60 * logoIm.naturalWidth) / logoIm.naturalHeight, h: 60 })
  for (let i = 0; i < n; i++) {
    const li = loadedImage(logos[i]!.id)
    if (!li) continue
    const r = containRect(sized(li), 0, 0, slotW, 64, false)
    parts.push({ img: li, w: r.w, h: r.h })
  }
  const total = parts.reduce((s, p) => s + p.w, 0) + gap * Math.max(0, parts.length - 1)
  let x = (SIZE - total) / 2
  for (const p of parts) {
    ctx.drawImage(p.img, x, 1005 - p.h / 2, p.w, p.h)
    x += p.w + gap
  }
  ctx.restore()
  return hit
}
