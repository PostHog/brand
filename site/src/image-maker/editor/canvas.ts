// Drawing helpers the makers share: RoundHog on a canvas, text measuring, the images a drawing
// uses (loaded once, redrawn when they arrive) and small geometry.

/** RoundHog's weights as the site registers them (`@posthog/brand/fonts/css`, in main.tsx). */
export const REGULAR = 400
export const MEDIUM = 500
export const SEMIBOLD = 700
export const BOLD = 800

export const FONT = '"RoundHog", system-ui, -apple-system, "Segoe UI", sans-serif'

export function fontStr(weight: number, size: number, family = FONT): string {
  return `${weight} ${size}px ${family}`
}

export function clamp(v: unknown, lo: number, hi: number, fallback: number): number {
  let n = Number(v)
  if (!Number.isFinite(n)) n = fallback
  return Math.min(hi, Math.max(lo, n))
}

/** A file-name-safe version of a title. */
export function slugify(s: string, fallback: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || fallback
  )
}

export function setLetterSpacing(ctx: CanvasRenderingContext2D, px: number) {
  if ("letterSpacing" in ctx) ctx.letterSpacing = `${px}px`
}

let measureCtx: CanvasRenderingContext2D | null = null
function mctx(): CanvasRenderingContext2D {
  measureCtx ??= document.createElement("canvas").getContext("2d")!
  return measureCtx
}

export function measure(
  text: string,
  weight: number,
  size: number,
  letterSpacing = 0,
  family = FONT,
): number {
  const c = mctx()
  c.font = fontStr(weight, size, family)
  setLetterSpacing(c, letterSpacing)
  const w = c.measureText(text).width
  setLetterSpacing(c, 0)
  return w
}

/** The font's ascent and descent at a size (its line box, not the glyphs'). */
export function vMetrics(weight: number, size: number, family = FONT) {
  const c = mctx()
  c.font = fontStr(weight, size, family)
  const m = c.measureText("Hg")
  return {
    asc: m.fontBoundingBoxAscent || size * 0.93,
    desc: m.fontBoundingBoxDescent || size * 0.24,
  }
}

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  r = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Where a pointer event lands, in the drawing's own units. */
export function toUnits(
  ev: { clientX: number; clientY: number },
  el: Element,
  w: number,
  h: number,
) {
  const r = el.getBoundingClientRect()
  return { x: ((ev.clientX - r.left) * w) / r.width, y: ((ev.clientY - r.top) * h) / r.height }
}

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export function inRect(p: { x: number; y: number }, r: Rect | null | undefined): boolean {
  return !!r && p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h
}

// ---- Images ----

interface CachedImage {
  el: HTMLImageElement
  ok: boolean
  /** Loaded or failed: nothing more to wait for. */
  settled: boolean
}
const images = new Map<string, CachedImage>()
const listeners = new Set<() => void>()

/** Calls back whenever an image (or a font) a drawing asked for finishes loading. */
export function onAssetLoad(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
function assetLoaded() {
  for (const fn of listeners) fn()
}

// Hoggie SVGs often have only a viewBox and no width/height, so a canvas can't size or draw
// them. Each SVG gets an explicit size before it's loaded for drawing (at least `minWidth` wide,
// so a small vector stays sharp when it's drawn large).
function sizedSvgUrl(txt: string, minWidth = 0): string | null {
  const m = /<svg\b[^>]*>/i.exec(txt)
  if (!m) return null
  const tag = m[0]
  const vb = /viewBox\s*=\s*["']\s*[-\d.eE]+[\s,]+[-\d.eE]+[\s,]+([\d.eE]+)[\s,]+([\d.eE]+)/i.exec(
    tag,
  )
  const wA = /\swidth\s*=\s*["']\s*([\d.]+)(px)?\s*["']/i.exec(tag)
  const hA = /\sheight\s*=\s*["']\s*([\d.]+)(px)?\s*["']/i.exec(tag)
  let w = wA ? +wA[1]! : vb ? +vb[1]! : 0
  let h = hA ? +hA[1]! : vb ? +vb[2]! : 0
  if (!w || !h) {
    w = 1000
    h = 1000
  }
  if (minWidth) {
    const k = Math.max(1, minWidth / w)
    w = Math.round(w * k)
    h = Math.round(h * k)
  }
  const fixed = tag
    .replace(/\s(width|height)\s*=\s*("[^"]*"|'[^']*')/gi, "")
    .replace(/^<svg\b/i, `<svg width="${w}" height="${h}"`)
  const out = txt.slice(0, m.index) + fixed + txt.slice(m.index + tag.length)
  try {
    return URL.createObjectURL(new Blob([out], { type: "image/svg+xml" }))
  } catch {
    return null
  }
}

function cacheKey(url: string, minWidth: number) {
  return minWidth ? `${url}#min${minWidth}` : url
}

/**
 * The image at a URL if it has loaded, else null (and starts loading it). Drawings call this
 * every frame; `onAssetLoad` listeners redraw once it arrives. `minWidth` rasterizes an SVG at
 * least that wide.
 */
export function loadedImage(url: string | undefined | null, minWidth = 0): HTMLImageElement | null {
  if (!url) return null
  const key = cacheKey(url, minWidth)
  const cached = images.get(key)
  if (cached) return cached.ok ? cached.el : null
  const el = new Image()
  // A picture from another site (a logo URL an agent passed) loads in CORS mode, so the canvas it's
  // drawn on can still be exported. Its server must allow it; if not, it fails and isn't drawn.
  if (/^https?:/i.test(url) && new URL(url).origin !== window.location.origin)
    el.crossOrigin = "anonymous"
  const entry: CachedImage = { el, ok: false, settled: false }
  images.set(key, entry)
  el.onload = () => {
    entry.ok = el.naturalWidth > 0 && el.naturalHeight > 0
    entry.settled = true
    assetLoaded()
  }
  el.onerror = () => {
    entry.settled = true
    assetLoaded()
  }
  fetch(url)
    .then((r) => ((r.headers.get("content-type") ?? "").includes("svg") ? r.text() : null))
    .then((txt) => {
      el.src = (txt && sizedSvgUrl(txt, minWidth)) || url
    })
    .catch(() => {
      el.src = url
    })
  return null
}

/** Whether the image at a URL failed to load (as opposed to still loading). */
export function imageFailed(url: string | undefined | null, minWidth = 0): boolean {
  const entry = url ? images.get(cacheKey(url, minWidth)) : undefined
  return !!entry && entry.settled && !entry.ok
}

/** Resolves once the images a drawing needs have loaded (or failed), e.g. before a download. */
export function imagesReady(urls: (string | undefined | null)[], minWidth = 0): Promise<void> {
  const settled = (u: string) => {
    loadedImage(u, minWidth) // starts the load if nothing has asked for it yet
    return images.get(cacheKey(u, minWidth))?.settled ?? false
  }
  const pending = urls.filter((u): u is string => !!u && !settled(u))
  if (!pending.length) return Promise.resolve()
  return new Promise((resolve) => {
    const timeout = window.setTimeout(done, 8000)
    const off = onAssetLoad(() => {
      if (pending.every(settled)) done()
    })
    function done() {
      window.clearTimeout(timeout)
      off()
      resolve()
    }
  })
}

// ---- Fonts ----

const fontLoads = new Map<string, Promise<unknown>>()

/**
 * Asks the browser for the font faces a text needs. Canvas text doesn't trigger web font loads
 * by itself, and RoundHog is split by script (unicode-range), so a title in another script
 * loads its subset here. Listeners redraw when a new face arrives.
 */
export function requestFonts(weights: number[], text: string, family = "RoundHog") {
  const chars = [...new Set(text)].sort().join("")
  for (const w of weights) {
    const key = `${w}|${family}|${chars}`
    if (fontLoads.has(key)) continue
    const p = document.fonts.load(`${w} 16px "${family}"`, chars || "A").then(assetLoaded, () => {})
    fontLoads.set(key, p)
  }
}
