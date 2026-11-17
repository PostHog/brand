// Draws a blog image in 1920 × 1080 units, following the canvas template the design started as:
// the title (balanced, with a highlighted phrase), an optional subheading, the authors on the
// bottom padding, and the hoggie on the right.

import {
  BOLD,
  MEDIUM,
  REGULAR,
  type Rect,
  SEMIBOLD,
  clamp,
  fontStr,
  loadedImage,
  roundRect,
  setLetterSpacing,
  vMetrics,
} from "../../editor/canvas.ts"
import {
  type BlogDoc,
  H,
  W,
  authorsOf,
  highlightIndex,
  hogUrl,
  look,
  resolvedHog,
} from "./model.ts"

const PAD_X = 128
const PAD_Y = 120

// ---- Text layout: words made of pieces, each with its own weight and highlight ----

interface Piece {
  t: string
  w: number
  hl: boolean
  width: number
}
type Word = Piece[]
interface Mark {
  w: number
  hl: boolean
}
interface Line {
  words: Word[]
  w: number
}
interface BlockOpts {
  size: number
  weight: number
  ls: number
  lh: number
  maxW: number
  balance: boolean
}
interface Block {
  lines: Line[]
  spaceW: number
}

let mctxCache: CanvasRenderingContext2D | null = null
function mctx(): CanvasRenderingContext2D {
  mctxCache ??= document.createElement("canvas").getContext("2d")!
  return mctxCache
}

/** Paragraphs of words; `marks` gives each character's weight and highlight. Breaks at "\n" or "|". */
function toParagraphs(text: string, marks: Mark[]): Word[][] {
  const paras: Word[][] = [[]]
  let word: Word | null = null
  let prev: Piece | null = null
  const endWord = () => {
    if (word && word.length) paras[paras.length - 1]!.push(word)
    word = null
    prev = null
  }
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!
    if (ch === "\n" || ch === "|") {
      endWord()
      paras.push([])
      continue
    }
    if (/\s/.test(ch)) {
      endWord()
      continue
    }
    const mk = marks[i]!
    word ??= []
    if (prev && prev.w === mk.w && prev.hl === mk.hl) prev.t += ch
    else {
      prev = { t: ch, w: mk.w, hl: mk.hl, width: 0 }
      word.push(prev)
    }
  }
  endWord()
  return paras.filter((p, idx) => p.length || idx === 0)
}

function pieceW(p: Piece, size: number, ls: number): number {
  const c = mctx()
  c.font = fontStr(p.w, size)
  setLetterSpacing(c, ls)
  const w = c.measureText(p.t).width
  setLetterSpacing(c, 0)
  return w
}

/** Greedy wrap of one paragraph at width maxW. */
function wrapPara(words: Word[], maxW: number, spaceW: number): Line[] {
  const lines: Line[] = []
  let cur: Word[] = []
  let curW = 0
  for (const wd of words) {
    const ww = wd.reduce((s, p) => s + p.width, 0)
    const add = (cur.length ? spaceW : 0) + ww
    if (cur.length && curW + add > maxW) {
      lines.push({ words: cur, w: curW })
      cur = [wd]
      curW = ww
    } else {
      cur.push(wd)
      curW += add
    }
  }
  if (cur.length || !lines.length) lines.push({ words: cur, w: curW })
  return lines
}

function layoutBlock(text: string, marks: Mark[], opts: BlockOpts): Block {
  const paras = toParagraphs(text, marks)
  const c = mctx()
  c.font = fontStr(opts.weight, opts.size)
  setLetterSpacing(c, opts.ls)
  const spaceW = c.measureText(" ").width
  setLetterSpacing(c, 0)
  for (const words of paras)
    for (const wd of words) for (const p of wd) p.width = pieceW(p, opts.size, opts.ls)
  const out: Line[] = []
  for (const words of paras) {
    let lines = wrapPara(words, opts.maxW, spaceW)
    if (opts.balance && lines.length > 1) {
      // Narrowest width that keeps the same number of lines (CSS text-wrap: balance).
      let lo = opts.maxW * 0.4
      let hi = opts.maxW
      const n = lines.length
      for (let k = 0; k < 18; k++) {
        const mid = (lo + hi) / 2
        if (wrapPara(words, mid, spaceW).length > n) lo = mid
        else hi = mid
      }
      lines = wrapPara(words, hi, spaceW)
    }
    out.push(...lines)
  }
  return { lines: out, spaceW }
}

interface Placed {
  p?: Piece
  gap?: boolean
  x: number
  w: number
  hl: boolean
}

/** Draws a laid-out block from its top edge. Returns its height. */
function drawBlock(
  ctx: CanvasRenderingContext2D,
  block: Block,
  x: number,
  top: number,
  opts: BlockOpts,
  colors: { text: string; hl: string; hlBox: string },
): number {
  const lh = opts.size * opts.lh
  const vm = vMetrics(opts.weight, opts.size)
  const pad = opts.size * 0.1
  const rad = opts.size * 0.125
  block.lines.forEach((line, li) => {
    const baseline = top + li * lh + (lh - (vm.asc + vm.desc)) / 2 + vm.asc
    // Lay out pieces, adding the highlight padding at each highlighted run's edges.
    let cx = x
    const items: Placed[] = []
    let prevHl = false
    line.words.forEach((wd, wi) => {
      if (wi > 0) {
        const nextHl = wd[0]!.hl
        if (prevHl && !nextHl) {
          cx += pad
          prevHl = false
        }
        items.push({ gap: true, x: cx, w: block.spaceW, hl: prevHl && nextHl })
        cx += block.spaceW
      }
      for (const p of wd) {
        if (p.hl && !prevHl) cx += pad
        if (!p.hl && prevHl) cx += pad
        items.push({ p, x: cx, w: p.width, hl: p.hl })
        cx += p.width
        prevHl = p.hl
      }
    })
    // Highlight boxes behind each run.
    let run: { x0: number; x1: number } | null = null
    const closeRun = () => {
      if (!run) return
      ctx.fillStyle = colors.hlBox
      // Same as the PostHog Deck headings: one band per line, centred on the letters and a little
      // shorter than the line height, so bands on stacked lines never touch or overlap.
      const bandH = lh - Math.max(3, Math.round(opts.size * 0.045))
      const cy = baseline + (vm.desc - vm.asc) / 2
      roundRect(ctx, run.x0 - pad, cy - bandH / 2, run.x1 - run.x0 + pad * 2, bandH, rad)
      ctx.fill()
      run = null
    }
    for (const it of items) {
      if (it.hl) {
        if (!run) run = { x0: it.x, x1: it.x + it.w }
        else run.x1 = it.x + it.w
      } else closeRun()
    }
    closeRun()
    for (const it of items) {
      if (!it.p) continue
      ctx.font = fontStr(it.p.w, opts.size)
      setLetterSpacing(ctx, opts.ls)
      ctx.fillStyle = it.hl ? colors.hl : colors.text
      ctx.fillText(it.p.t, it.x, baseline)
    }
    setLetterSpacing(ctx, 0)
  })
  return block.lines.length * lh
}

function containTop(im: HTMLImageElement, bx: number, by: number, bw: number, bh: number) {
  const k = Math.min(bw / im.naturalWidth, bh / im.naturalHeight)
  const w = im.naturalWidth * k
  const h = im.naturalHeight * k
  return { x: bx + (bw - w) / 2, y: by, w, h }
}

/** Removes ** markers from the subheading; text between pairs is bold. */
function subMarks(sub: string, normal: number, bold: number) {
  const parts = String(sub || "").split("**")
  let text = ""
  const marks: Mark[] = []
  parts.forEach((part, k) => {
    // By UTF-16 unit, so marks line up with the text's indexes.
    for (let i = 0; i < part.length; i++) {
      text += part[i]
      marks.push({ w: k % 2 ? bold : normal, hl: false })
    }
  })
  return { text: text.trim() ? text : "", marks }
}

export interface DrawResult {
  /** The hoggie, in 1920 × 1080 units: clicking it opens the hoggie picker. */
  hit: Rect
  /** The hoggie drawn (the automatic match when the document leaves it to the maker). */
  hog: string
}

/** Every image a drawing uses, so a download can wait for them. */
export function imagesOf(d: BlogDoc): string[] {
  return [hogUrl(resolvedHog(d))].filter(Boolean)
}

export function drawPost(ctx: CanvasRenderingContext2D, d: BlogDoc): DrawResult {
  const L = look(d)
  // Lighter weights on light text, so it doesn't look heavier than dark text on a light ground.
  const titleW = L.lightText ? MEDIUM : SEMIBOLD
  const authorW = L.lightText ? REGULAR : MEDIUM
  const boldW = L.lightText ? SEMIBOLD : BOLD
  ctx.save()
  ctx.fillStyle = L.base
  ctx.fillRect(0, 0, W, H)
  if (L.wash) {
    ctx.fillStyle = L.wash
    ctx.fillRect(0, 0, W, H)
  }
  ctx.textBaseline = "alphabetic"
  ctx.textAlign = "left"

  // Hoggie: 1000px box, right edge, top 254; scaled and moved around (1420, 1080).
  let hit: Rect
  const name = resolvedHog(d)
  const im = loadedImage(hogUrl(name))
  const size = clamp(d.hogSize, 75, 125, 100) / 100
  const tx = clamp(d.hogX, -20, 20, 0) * 10
  const ty = -clamp(d.hogY, -20, 20, 0) * 10
  const ox = 1420
  const oy = 1080
  if (im) {
    const r = containTop(im, 920, 254, 1000, 1000)
    ctx.save()
    ctx.translate(ox + tx, oy + ty)
    ctx.scale(d.flip ? -size : size, size)
    ctx.translate(-ox, -oy)
    ctx.drawImage(im, r.x, r.y, r.w, r.h)
    ctx.restore()
    const x1 = ox + tx + (r.x - ox) * size
    const x2 = ox + tx + (r.x + r.w - ox) * size
    hit = {
      x: Math.min(x1, x2),
      y: oy + ty + (r.y - oy) * size,
      w: Math.abs(x2 - x1),
      h: r.h * size,
    }
  } else {
    hit = { x: 920, y: 254, w: 1000, h: 826 }
  }

  // Title
  const title = String(d.title || "")
  const marks: Mark[] = Array.from({ length: title.length }, () => ({ w: titleW, hl: false }))
  const hi = highlightIndex(d)
  if (hi.idx >= 0)
    for (let j = hi.idx; j < hi.idx + hi.len; j++) marks[j] = { w: SEMIBOLD, hl: true }
  const tOpts: BlockOpts = {
    size: 128,
    weight: titleW,
    ls: -1.28,
    lh: 1.05,
    maxW: W - PAD_X * 2,
    balance: true,
  }
  const titleH = drawBlock(ctx, layoutBlock(title, marks, tOpts), PAD_X, PAD_Y, tOpts, {
    text: L.text,
    hl: L.hl,
    hlBox: L.hlBox,
  })

  // Subheading: one title line (134px) below the title.
  const sm = subMarks(d.sub, REGULAR, boldW)
  if (sm.text) {
    const sOpts: BlockOpts = {
      size: 64,
      weight: REGULAR,
      ls: 0,
      lh: 1.2,
      maxW: 720,
      balance: false,
    }
    drawBlock(ctx, layoutBlock(sm.text, sm.marks, sOpts), PAD_X, PAD_Y + titleH + 134, sOpts, {
      text: L.sub,
      hl: L.sub,
      hlBox: "transparent",
    })
  }

  // Authors, sitting on the bottom padding.
  const author = authorsOf(d).join("\n")
  if (author) {
    const aOpts: BlockOpts = {
      size: 48,
      weight: authorW,
      ls: 0,
      lh: 1.2,
      maxW: W - PAD_X * 2,
      balance: false,
    }
    const aMarks = Array.from({ length: author.length }, () => ({ w: authorW, hl: false }))
    const aBlock = layoutBlock(author, aMarks, aOpts)
    const aH = aBlock.lines.length * 48 * 1.2
    drawBlock(ctx, aBlock, PAD_X, H - PAD_Y - aH, aOpts, {
      text: L.sub,
      hl: L.sub,
      hlBox: "transparent",
    })
  }
  ctx.restore()
  return { hit, hog: name }
}
