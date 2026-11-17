// Draws a build mode image at one size, in that size's pixels. The maths follows the canvas
// template the design started as: a 1920 × 1080 layout scaled (and tuned) per size.

import {
  type Rect,
  MEDIUM,
  SEMIBOLD,
  clamp,
  fontStr,
  loadedImage,
  measure,
  roundRect,
  setLetterSpacing,
  vMetrics,
} from "../../editor/canvas.ts"
import { ASSETS, type BuildDoc, FORMATS, type FormatKey, HL, authorsOf, fitOf } from "./model.ts"

const TITLE_INK = "#545E6B"
const GRID_INK = "rgba(76, 198, 219, 0.302)"
const TANGERINE = "hsl(17, 100%, 55%)"
const TANGERINE_BOX = "hsla(17, 100%, 55%, 0.2)"

// ---- Title layout ----

interface Token {
  t: string
  hl: boolean
  spaceBefore?: boolean
  spaceAfter?: boolean
  /** Measured width, including the highlight's padding. */
  w: number
  /** The space before this token on its line. */
  gap: number
}

/** Words, with the highlighted phrase kept as one unbreakable token (like the template's inline-block). */
function titleTokens(title: string, word: string) {
  const t = String(title || "").replace(/\|/g, "\n")
  const w = String(word || "").trim()
  const idx = w ? t.toLowerCase().indexOf(w.toLowerCase()) : -1
  const parts =
    idx >= 0
      ? [
          { s: t.slice(0, idx), hl: false },
          { s: t.slice(idx, idx + w.length), hl: true },
          { s: t.slice(idx + w.length), hl: false },
        ]
      : [{ s: t, hl: false }]
  const paras: Token[][] = [[]]
  for (const p of parts) {
    if (p.hl) {
      paras[paras.length - 1]!.push({ t: p.s, hl: true, w: 0, gap: 0 })
      continue
    }
    p.s.split("\n").forEach((ln, li) => {
      if (li > 0) paras.push([])
      const startsSpace = /^\s/.test(ln)
      const endsSpace = /\s$/.test(ln)
      const words = ln.split(/\s+/).filter(Boolean)
      words.forEach((wd, wi) => {
        paras[paras.length - 1]!.push({
          t: wd,
          hl: false,
          spaceBefore: wi > 0 || startsSpace,
          spaceAfter: wi < words.length - 1 || endsSpace,
          w: 0,
          gap: 0,
        })
      })
    })
  }
  return { paras, found: idx >= 0 || !w }
}

interface Line {
  toks: Token[]
  w: number
}

function wrapTokens(tokens: Token[], maxW: number, spaceW: number): Line[] {
  const lines: Line[] = []
  let cur: Token[] = []
  let curW = 0
  for (const tk of tokens) {
    const prev = cur.length ? cur[cur.length - 1]! : null
    let gap = 0
    if (prev) {
      // Space between tokens unless the highlight sits directly against a word.
      const touching = (tk.hl && !prev.spaceAfter) || (prev.hl && !tk.spaceBefore)
      gap = touching ? 0 : spaceW
    }
    if (cur.length && curW + gap + tk.w > maxW) {
      lines.push({ toks: cur, w: curW })
      cur = [tk]
      curW = tk.w
      tk.gap = 0
    } else {
      tk.gap = cur.length ? gap : 0
      cur.push(tk)
      curW += (cur.length > 1 ? gap : 0) + tk.w
    }
  }
  if (cur.length || !lines.length) lines.push({ toks: cur, w: curW })
  return lines
}

/** Wraps the title, then balances each paragraph's lines (narrowest width, same line count). */
function layoutTitle(title: string, word: string, size: number, maxW: number) {
  const ls = -0.01 * size
  const pad = 0.1 * size
  const tt = titleTokens(title, word)
  const spaceW = measure(" ", SEMIBOLD, size, ls)
  const out: Line[] = []
  for (const toks of tt.paras) {
    for (const tk of toks) tk.w = measure(tk.t, SEMIBOLD, size, ls) + (tk.hl ? pad * 2 : 0)
    let lines = wrapTokens(toks, maxW, spaceW)
    if (lines.length > 1) {
      let lo = maxW * 0.4
      let hi = maxW
      const n = lines.length
      for (let k = 0; k < 18; k++) {
        const mid = (lo + hi) / 2
        if (wrapTokens(toks, mid, spaceW).length > n) lo = mid
        else hi = mid
      }
      lines = wrapTokens(toks, hi, spaceW)
    }
    out.push(...lines)
  }
  return { lines: out, found: tt.found, ls, pad }
}

// ---- Layout per size (same maths as the canvas template) ----

function geom(fmt: FormatKey, d: BuildDoc) {
  const F = FORMATS[fmt]
  const W = F.w
  const H = F.h
  const tune = F.tune ?? {}
  const sx = W / 1920
  const sy = H / 1080
  const sc = Math.min(sx, sy)
  const padX = tune.padX ?? 128 * sx
  const aS = sc * (tune.author ?? 1)
  return {
    W,
    H,
    sc,
    grid: clamp(d.gridSize, 24, 160, 64) * sc * (tune.grid ?? 1),
    padTop: 120 * sy,
    padX,
    titleSize: 140 * sc * (tune.title ?? 1),
    titleMaxW: tune.padX != null ? W - 2 * padX : 1040 * sx,
    box: { x: 901 * sx, y: 104 * sy, w: 1041 * sx, h: 980 * sy },
    logoH: clamp(d.logoSize, 60, 167, 120) * sc * (tune.logo ?? 1),
    logoInset: tune.logoInset ?? 48 * sc,
    authorRight: 348 * sx,
    authorBottom: 48 * sy,
    authorGap: 29 * aS,
    avatar: 108 * aS,
    authorSize: 58 * aS,
    label: 36 * sc,
    showAuthor: F.author,
    showRip: F.rip && d.showRip !== false,
    showLogo: F.logo && d.showLogo !== false,
  }
}

export interface DrawResult {
  /** The image box, in this size's pixels: clicking it uploads an image. */
  hit: Rect
  /** Whether the highlight text was found in the title. */
  hlFound: boolean
}

/** Every image a drawing can use, so a download can wait for them. */
export function imagesOf(d: BuildDoc): string[] {
  return [
    ASSETS.buildLogo,
    ASSETS.rip,
    d.imgId,
    ...authorsOf(d).map((a) => ASSETS.authors[a] ?? ""),
  ].filter(Boolean)
}

export function drawPost(
  ctx: CanvasRenderingContext2D,
  d: BuildDoc,
  fmt: FormatKey,
  opts: { exporting?: boolean } = {},
): DrawResult {
  const g = geom(fmt, d)
  const { W, H } = g
  ctx.save()
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, W, H)
  ctx.textBaseline = "alphabetic"
  ctx.textAlign = "left"

  // 1 Grid (bottom)
  const cell = g.grid
  if (cell > 2) {
    ctx.fillStyle = GRID_INK
    let ox = ((W - cell) / 2) % cell
    if (ox < 0) ox += cell
    let oy = ((H - cell) / 2) % cell
    if (oy < 0) oy += cell
    for (let x = ox - cell; x < W; x += cell) ctx.fillRect(Math.round(x), 0, 2, H)
    for (let y = oy - cell; y < H; y += cell) ctx.fillRect(0, Math.round(y), W, 2)
  }

  // 2 Build mode logo
  if (g.showLogo) {
    const lg = loadedImage(ASSETS.buildLogo)
    if (lg) {
      const lw = (g.logoH * lg.naturalWidth) / lg.naturalHeight
      ctx.drawImage(lg, W - g.logoInset - lw, g.logoInset, lw, g.logoH)
    }
  }

  // 3 Title
  const size = g.titleSize
  const hl = HL[d.highlight] ?? HL.purple
  const L = layoutTitle(d.title, d.hlText, size, g.titleMaxW)
  const vm = vMetrics(SEMIBOLD, size)
  const lh = size * 1.05
  L.lines.forEach((line, li) => {
    const baseline = g.padTop + li * lh + (lh - (vm.asc + vm.desc)) / 2 + vm.asc
    let cx = g.padX
    for (const tk of line.toks) {
      cx += tk.gap
      ctx.font = fontStr(SEMIBOLD, size)
      setLetterSpacing(ctx, L.ls)
      if (tk.hl) {
        const center = baseline - vm.asc + (vm.asc + vm.desc) / 2
        const bh = size * 1.1
        ctx.fillStyle = hl[1]
        roundRect(ctx, cx, center - bh / 2, tk.w, bh, size * 0.125)
        ctx.fill()
        ctx.fillStyle = hl[0]
        ctx.fillText(tk.t, cx + L.pad, baseline)
      } else {
        ctx.fillStyle = TITLE_INK
        ctx.fillText(tk.t, cx, baseline)
      }
      cx += tk.w
    }
    setLetterSpacing(ctx, 0)
  })

  // 4 Image
  const b = g.box
  const fit = fitOf(d, fmt)
  const s = ((clamp(d.imgSize, 50, 150, 100) / 100) * fit.size) / 100
  const tx = clamp(d.imgX, -600, 600, 0) * g.sc + fit.x
  const ty = -clamp(d.imgY, -600, 600, 0) * g.sc - fit.y
  const cxB = b.x + b.w / 2
  const cyB = b.y + b.h / 2
  const im = loadedImage(d.imgId)
  ctx.save()
  ctx.translate(cxB + tx, cyB + ty)
  ctx.rotate((fit.r * Math.PI) / 180)
  ctx.scale(d.flip ? -s : s, s)
  ctx.translate(-cxB, -cyB)
  if (im) {
    const k = Math.min(b.w / im.naturalWidth, b.h / im.naturalHeight)
    const iw = im.naturalWidth * k
    const ih = im.naturalHeight * k
    ctx.drawImage(im, b.x + (b.w - iw) / 2, b.y + (b.h - ih) / 2, iw, ih)
  } else if (!opts.exporting) {
    drawPlaceholder(ctx, b, g.sc, g.label, d.flip, cxB, cyB)
  }
  ctx.restore()
  const hx1 = cxB + tx + (b.x - cxB) * s
  const hx2 = cxB + tx + (b.x + b.w - cxB) * s
  const hit = {
    x: Math.min(hx1, hx2),
    y: cyB + ty + (b.y - cyB) * s,
    w: Math.abs(hx2 - hx1),
    h: b.h * s,
  }

  // 5 Paper rip
  if (g.showRip) {
    const rp = loadedImage(ASSETS.rip)
    if (rp) {
      const rh = (W * rp.naturalHeight) / rp.naturalWidth
      ctx.drawImage(rp, 0, H - rh, W, rh)
    }
  }

  // 6 Authors (top)
  const people = authorsOf(d)
  if (g.showAuthor && people.length) {
    const as = g.authorSize
    const av = g.avatar
    const apad = as * 0.1
    const rowH = Math.max(av, as * 1.2)
    const rowGap = av * 0.18
    // Stacked rows share one left edge (the widest row keeps the template's right margin).
    let widest = 0
    for (const n of people)
      widest = Math.max(widest, av + g.authorGap + measure(n, SEMIBOLD, as) + apad * 2)
    const x0 = W - g.authorRight - widest
    people.forEach((who, pi) => {
      const nameW = measure(who, SEMIBOLD, as) + apad * 2
      const rowBottom = H - g.authorBottom - (people.length - 1 - pi) * (rowH + rowGap)
      const rowTop = rowBottom - rowH
      const acy = rowTop + rowH / 2
      ctx.save()
      ctx.beginPath()
      ctx.arc(x0 + av / 2, acy, av / 2, 0, Math.PI * 2)
      ctx.closePath()
      ctx.fillStyle = TANGERINE
      ctx.fill()
      ctx.clip()
      const aim = loadedImage(ASSETS.authors[who])
      if (aim) {
        const kk = Math.max(av / aim.naturalWidth, av / aim.naturalHeight)
        const aw = aim.naturalWidth * kk
        ctx.drawImage(aim, x0 + (av - aw) / 2, acy - av / 2, aw, aim.naturalHeight * kk)
      }
      ctx.restore()
      const nm = vMetrics(SEMIBOLD, as)
      const nx = x0 + av + g.authorGap
      const nBase = acy - (nm.asc + nm.desc) / 2 + nm.asc
      ctx.fillStyle = TANGERINE_BOX
      roundRect(ctx, nx, nBase - nm.asc, nameW, nm.asc + nm.desc, as * 0.125)
      ctx.fill()
      ctx.fillStyle = TANGERINE
      ctx.font = fontStr(SEMIBOLD, as)
      ctx.fillText(who, nx + apad, nBase)
    })
  }
  ctx.restore()
  return { hit, hlFound: L.found }
}

/** The dashed "Click to add image" box, drawn in place of the image until there is one. */
function drawPlaceholder(
  ctx: CanvasRenderingContext2D,
  b: Rect,
  sc: number,
  label: number,
  flip: boolean,
  cxB: number,
  cyB: number,
) {
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)"
  ctx.fillRect(b.x, b.y, b.w, b.h)
  ctx.strokeStyle = "#9ca3af"
  ctx.lineWidth = Math.max(2, 4 * sc)
  ctx.setLineDash([12 * sc, 8 * sc])
  ctx.strokeRect(b.x + 2, b.y + 2, b.w - 4, b.h - 4)
  ctx.setLineDash([])
  // Keep the icon and label readable when the image is flipped.
  if (flip) {
    ctx.translate(cxB * 2, 0)
    ctx.scale(-1, 1)
  }
  const ic = 96 * sc
  const icx = cxB - ic / 2
  const icy = cyB - ic / 2 - label
  ctx.strokeStyle = TITLE_INK
  ctx.lineWidth = Math.max(1.5, 6 * sc)
  ctx.lineJoin = "round"
  ctx.lineCap = "round"
  roundRect(ctx, icx + ic * 0.125, icy + ic * 0.125, ic * 0.75, ic * 0.75, ic * 0.08)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(icx + ic * 0.375, icy + ic * 0.375, ic * 0.083, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(icx + ic * 0.875, icy + ic * 0.625)
  ctx.lineTo(icx + ic * 0.667, icy + ic * 0.417)
  ctx.lineTo(icx + ic * 0.208, icy + ic * 0.875)
  ctx.stroke()
  ctx.fillStyle = TITLE_INK
  ctx.font = fontStr(MEDIUM, label)
  ctx.textAlign = "center"
  ctx.fillText("Click to add image", cxB, icy + ic + label * 1.3)
  ctx.textAlign = "left"
}
