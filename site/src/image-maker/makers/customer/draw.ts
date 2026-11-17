// Draws a customer story image in its own 1920 × 1080 units (the canvas template's maths).

import {
  BOLD,
  type Rect,
  SEMIBOLD,
  clamp,
  fontStr,
  imageFailed,
  loadedImage,
  setLetterSpacing,
  vMetrics,
} from "../../editor/canvas.ts"
import {
  type CustomerDoc,
  H,
  type LogoInfo,
  W,
  displayName,
  hogUrl,
  logoInfo,
  look,
  resolvedHog,
} from "./model.ts"

const PAD_X = 144
const PAD_Y = 128

/** Logos and hoggies are small vectors: rasterize them at least this wide so they stay sharp at 2×. */
export const MIN_WIDTH = 1600

function image(url: string | undefined) {
  return loadedImage(url, MIN_WIDTH)
}

interface Sized {
  source: CanvasImageSource
  w: number
  h: number
}

// A one-color copy of an image (for "Match text").
const tints = new Map<string, Sized>()
function tinted(im: HTMLImageElement, url: string, color: string): Sized {
  const k = `${url}|${color}`
  const hit = tints.get(k)
  if (hit) return hit
  const c = document.createElement("canvas")
  c.width = im.naturalWidth
  c.height = im.naturalHeight
  const x = c.getContext("2d")!
  x.drawImage(im, 0, 0, c.width, c.height)
  x.globalCompositeOperation = "source-in"
  x.fillStyle = color
  x.fillRect(0, 0, c.width, c.height)
  const out = { source: c, w: c.width, h: c.height }
  tints.set(k, out)
  return out
}

function contain(
  w0: number,
  h0: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
  alignTop: boolean,
  alignLeft: boolean,
): Rect {
  const k = Math.min(bw / w0, bh / h0)
  const w = w0 * k
  const h = h0 * k
  return { x: alignLeft ? bx : bx + (bw - w) / 2, y: alignTop ? by : by + (bh - h) / 2, w, h }
}

function wrapWords(text: string, maxW: number, ctx: CanvasRenderingContext2D): string[] {
  const lines: string[] = []
  let cur = ""
  for (const w of text.split(/\s+/).filter(Boolean)) {
    const n = cur ? `${cur} ${w}` : w
    if (cur && ctx.measureText(n).width > maxW) {
      lines.push(cur)
      cur = w
    } else cur = n
  }
  if (cur) lines.push(cur)
  return lines.length ? lines : [""]
}

export interface DrawResult {
  /** The hoggie, in image units: clicking it opens the hoggie picker. */
  hit: Rect
  hog: string
  logo: LogoInfo
}

/** Every image a drawing uses, so a download can wait for them. */
export function imagesOf(d: CustomerDoc): string[] {
  return [hogUrl(resolvedHog(d)), logoInfo(d, look(d).lightText).id ?? ""].filter(Boolean)
}

export function drawPost(ctx: CanvasRenderingContext2D, d: CustomerDoc): DrawResult {
  const L = look(d)
  ctx.save()
  ctx.fillStyle = L.base
  ctx.fillRect(0, 0, W, H)
  if (L.wash) {
    ctx.fillStyle = L.wash
    ctx.fillRect(0, 0, W, H)
  }
  ctx.textBaseline = "alphabetic"
  ctx.textAlign = "left"

  // Hoggie: 1240px box (top 220, right -110), drawn from its top; scaled and moved around (1410, 1080).
  let hit: Rect
  const name = resolvedHog(d)
  const him = image(hogUrl(name))
  const size = clamp(d.hogSize, 75, 125, 100) / 100
  const tx = clamp(d.hogX, -20, 20, 0) * 10
  const ty = -clamp(d.hogY, -20, 20, 0) * 10
  const ox = 1410
  const oy = 1080
  if (him) {
    const r = contain(him.naturalWidth, him.naturalHeight, 790, 220, 1240, 1240, true, false)
    ctx.save()
    ctx.translate(ox + tx, oy + ty)
    ctx.scale(d.flip ? -size : size, size)
    ctx.translate(-ox, -oy)
    ctx.drawImage(him, r.x, r.y, r.w, r.h)
    ctx.restore()
    const x1 = ox + tx + (r.x - ox) * size
    const x2 = ox + tx + (r.x + r.w - ox) * size
    hit = {
      x: Math.min(x1, x2),
      y: oy + ty + (r.y - oy) * size,
      w: Math.abs(x2 - x1),
      h: Math.min(H, r.h * size),
    }
  } else hit = { x: 900, y: 220, w: 1020, h: 860 }

  // "Customer story" label: 64px, 40% of the text color.
  const vm = vMetrics(SEMIBOLD, 64)
  ctx.font = fontStr(SEMIBOLD, 64)
  ctx.globalAlpha = 0.4
  ctx.fillStyle = L.text
  ctx.fillText("Customer story", PAD_X, PAD_Y + (64 - (vm.asc + vm.desc)) / 2 + vm.asc)
  ctx.globalAlpha = 1

  // Logo (880 × 163 box, left-aligned) or the company name until there is one.
  const top = PAD_Y + 64 + 48
  const li = logoInfo(d, L.lightText)
  let drawn = false
  if (li.id) {
    const lim = image(li.id)
    if (lim) {
      const s = clamp(d.logoSize, 50, 130, 100) / 100
      const bw = 880 * s
      const bh = 163 * s
      const src: Sized =
        li.mode === "match"
          ? tinted(lim, li.id, L.text)
          : { source: lim, w: lim.naturalWidth, h: lim.naturalHeight }
      const lr = contain(src.w, src.h, PAD_X, top + (163 - bh) / 2, bw, bh, false, true)
      ctx.drawImage(src.source, lr.x, lr.y, lr.w, lr.h)
      drawn = true
    } else if (!imageFailed(li.id, MIN_WIDTH)) drawn = true // still loading: leave the space empty
  }
  if (!drawn) {
    ctx.font = fontStr(BOLD, 140)
    setLetterSpacing(ctx, -1.4)
    ctx.fillStyle = L.text
    const vm2 = vMetrics(BOLD, 140)
    const lh = 147
    wrapWords(displayName(d), 1000, ctx)
      .slice(0, 4)
      .forEach((line, i) => {
        ctx.fillText(line, PAD_X, top + i * lh + (lh - (vm2.asc + vm2.desc)) / 2 + vm2.asc)
      })
    setLetterSpacing(ctx, 0)
  }
  ctx.restore()
  return { hit, hog: name, logo: li }
}
