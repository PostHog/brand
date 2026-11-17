// Blog images: post and newsletter headers, 1920 × 1080. This is the document a blog image saves,
// its colors, and how the hoggie is picked when the author leaves it to the maker.

import { type MakerHoggie, makerHoggies } from "../../hoggies.ts"
import type { Stamped } from "../../editor/store.ts"

export const W = 1920
export const H = 1080

/** Background colors, by tone: [300, 500, 700] (PostHog brand tokens). */
export const TONES = {
  blue: ["hsl(205, 84%, 80%)", "hsl(205, 84%, 49%)", "hsl(205, 84%, 38%)"],
  yellow: ["hsl(37, 100%, 82%)", "hsl(37, 100%, 55%)", "hsl(37, 100%, 45%)"],
  teal: ["hsl(165, 67%, 82%)", "hsl(165, 67%, 56%)", "hsl(165, 67%, 44%)"],
  purple: ["hsl(283, 63%, 81%)", "hsl(283, 63%, 52%)", "hsl(283, 64%, 42%)"],
  "corn-blue": ["hsl(194, 73%, 81%)", "hsl(195, 74%, 52%)", "hsl(195, 74%, 39%)"],
  coral: ["hsl(358, 100%, 86%)", "hsl(358, 100%, 64%)", "hsl(358, 100%, 47%)"],
  tangerine: ["hsl(17, 100%, 82%)", "hsl(17, 100%, 55%)", "hsl(17, 100%, 50%)"],
  lime: ["hsl(75, 72%, 76%)", "hsl(75, 72%, 46%)", "hsl(75, 72%, 40%)"],
  green: ["hsl(132, 54%, 82%)", "hsl(132, 54%, 53%)", "hsl(132, 54%, 45%)"],
  violet: ["hsl(250, 100%, 86%)", "hsl(250, 100%, 65%)", "hsl(250, 100%, 59%)"],
  cobalt: ["hsl(220, 100%, 80%)", "hsl(220, 100%, 51%)", "hsl(220, 100%, 41%)"],
  lemon: ["hsl(47, 100%, 82%)", "hsl(47, 100%, 55%)", "hsl(47, 100%, 47%)"],
} as const satisfies Record<string, readonly [string, string, string]>
export type ColorKey = keyof typeof TONES
export const COLOR_KEYS = Object.keys(TONES) as ColorKey[]

/** Highlight colors: [ink, box]. */
export const HL = {
  blue: ["hsl(205, 84%, 49%)", "hsla(205, 84%, 49%, 0.2)"],
  teal: ["hsl(165, 67%, 56%)", "hsla(165, 67%, 56%, 0.2)"],
  purple: ["hsl(283, 63%, 52%)", "hsla(283, 63%, 52%, 0.2)"],
  tangerine: ["hsl(17, 100%, 55%)", "hsla(17, 100%, 55%, 0.2)"],
  green: ["hsl(132, 54%, 53%)", "hsla(132, 54%, 53%, 0.2)"],
  white: ["#ffffff", "rgba(255, 255, 255, 0.25)"],
} as const satisfies Record<string, readonly [string, string]>
export type HlKey = keyof typeof HL
export const HL_KEYS = Object.keys(HL) as HlKey[]

export type Tone = "light" | "mid" | "dark"

/** What the hoggie field holds when the maker picks the hoggie from the title. */
export const AUTO = "Auto (match title)"
const FALLBACK_HOG = "Hogpatch"

// SEO / AEO posts: a fixed set of hoggies and light backgrounds; the highlight matches the background.
export const SEO_COLORS: ColorKey[] = ["tangerine", "lemon", "blue", "green", "purple"]
const SEO_HL: Partial<Record<ColorKey, HlKey>> = {
  tangerine: "tangerine",
  lemon: "teal",
  blue: "blue",
  green: "green",
  purple: "purple",
}
const SEO_HOGS = ["Reading", "Basketball Coach", "Float", "Organized", "Luchador"] // Luchador shows once it's in the library
export const SEO_AUTHOR = "Natalia Amorim"

export interface BlogDoc extends Stamped {
  title: string
  /** The phrase in the title to highlight. */
  hlText: string
  /** Retired for new images: only shown (and drawn) on images that already have one. */
  sub: string
  /** Not drawn: it helps match the hoggie. */
  description: string
  author: string
  /** Up to two more authors, each on their own line. */
  coAuthors?: string[]
  /** A hoggie's name, or AUTO. */
  hog: string
  hogSize: number
  hogX: number
  hogY: number
  flip: boolean
  color: ColorKey
  tone: Tone
  /** Text color on the midtone. */
  midText: "dark" | "white"
  highlight: HlKey
  /** An SEO / AEO post: limited hoggies and colors. */
  seo?: boolean
}

export const MAX_AUTHORS = 3

export function blank(): BlogDoc {
  const now = Date.now()
  return {
    title: "The hidden cost of running your own analytics",
    hlText: "hidden",
    sub: "",
    description: "",
    author: "First Last",
    hog: AUTO,
    hogSize: 100,
    hogX: 0,
    hogY: 0,
    flip: false,
    color: "lemon",
    tone: "light",
    midText: "dark",
    highlight: "purple",
    createdAt: now,
    updatedAt: now,
  }
}

export function hogs(): Record<string, MakerHoggie> {
  return makerHoggies()
}

export function hogUrl(name: string): string {
  return hogs()[name]?.id ?? ""
}

export function seoHogs(): string[] {
  const all = hogs()
  return SEO_HOGS.filter((n) => all[n])
}

export function plainTitle(d: BlogDoc): string {
  return (
    String(d.title || "")
      .replace(/\s*[\n|]\s*/g, " ")
      .trim() || "Untitled post"
  )
}

/** The main author plus co-authors, one line each. */
export function authorsOf(d: BlogDoc): string[] {
  return [d.author, ...(d.coAuthors ?? [])]
    .map((a) =>
      String(a || "")
        .replace(/[\n|]/g, " ")
        .trim(),
    )
    .filter(Boolean)
}

export function authorLabel(d: BlogDoc): string {
  return authorsOf(d).join(", ") || "No author"
}

export function isAuto(d: BlogDoc): boolean {
  return !d.hog || d.hog === AUTO
}

/** The hoggie that best matches the title, subheading and description: topics score 3, tags 1. */
export function autoHog(d: BlogDoc): string {
  const kw = hogs()
  const text = ` ${`${String(d.title || "")} ${String(d.sub || "")} ${String(d.description || "")}`
    .toLowerCase()
    .replace(/’/g, "'")
    .replace(/-/g, " ")
    .replace(/[^a-z0-9'/+ ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()} `
  const has = (k: string) => !!k && (text.includes(` ${k} `) || text.includes(` ${k}s `))
  const pool = d.seo ? seoHogs() : Object.keys(kw)
  let best = d.seo ? (pool[0] ?? FALLBACK_HOG) : FALLBACK_HOG
  let bestScore = 0
  for (const name of pool) {
    const h = kw[name]
    let s = 0
    for (const k of (h?.topics ?? "").split("|")) if (has(k)) s += 3
    for (const k of (h?.tags ?? "").split("|")) if (has(k)) s += 1
    if (s > bestScore) {
      best = name
      bestScore = s
    }
  }
  return best
}

/** The hoggie the image shows: the chosen one, or the automatic match. */
export function resolvedHog(d: BlogDoc): string {
  if (isAuto(d) || !hogs()[d.hog]) return autoHog(d)
  if (d.seo && !seoHogs().includes(d.hog)) return autoHog(d)
  return d.hog
}

// White highlight only works on white text: offered on Dark tone and on Midtone with white text.
export function whiteHlAllowed(d: Pick<BlogDoc, "tone" | "midText">): boolean {
  const t = d.tone || "light"
  return t === "dark" || (t === "mid" && d.midText === "white")
}

export function hlKeysFor(d: BlogDoc): HlKey[] {
  return whiteHlAllowed(d) ? HL_KEYS : HL_KEYS.filter((k) => k !== "white")
}

/** A tone/text change that would leave a white highlight where it isn't offered falls back to purple. */
export function toneEdit(d: BlogDoc, patch: Partial<BlogDoc>): Partial<BlogDoc> {
  const next = { ...d, ...patch }
  return next.highlight === "white" && !whiteHlAllowed(next)
    ? { ...patch, highlight: "purple" }
    : patch
}

/** The look a document's colors make. */
export function look(d: BlogDoc) {
  let t: readonly [string, string, string] = TONES[d.color] ?? TONES.lemon
  if (d.seo && !SEO_COLORS.includes(d.color)) t = TONES.tangerine
  const tone: Tone = d.seo ? "light" : d.tone === "mid" || d.tone === "dark" ? d.tone : "light"
  const dark = tone === "dark"
  const mid = tone === "mid"
  const whiteText = mid && d.midText === "white"
  const lightText = dark || whiteText
  let h: readonly [string, string] = HL[d.highlight] ?? HL.purple
  if (d.seo) h = HL[SEO_HL[SEO_COLORS.includes(d.color) ? d.color : "tangerine"]!]
  return {
    base: mid ? t[1] : dark ? t[2] : t[0],
    wash: mid ? null : dark ? "rgba(30, 31, 35, 0.7)" : "rgba(255, 255, 255, 0.7)",
    text: lightText ? "#ffffff" : "#1e1f23",
    sub: dark
      ? "#d1d5db"
      : whiteText
        ? "rgba(255, 255, 255, 0.9)"
        : mid
          ? "rgba(30, 31, 35, 0.85)"
          : "#374151",
    lightText,
    hl: h[0],
    hlBox: h[1],
  }
}

/** Whether the highlight text is in the title (or there's no highlight). */
export function highlightIndex(d: BlogDoc): { idx: number; len: number; found: boolean } {
  const w = String(d.hlText || "").trim()
  const idx = w
    ? String(d.title || "")
        .toLowerCase()
        .indexOf(w.toLowerCase())
    : -1
  return { idx, len: w.length, found: idx >= 0 || !w }
}

// ---- `#new-<hex>` links: a new image from hex-encoded UTF-8 JSON (for agents and scripts) ----
// Keys: title (required), description, highlight, author (or authors: [..] up to 3), hoggie,
// color, tone, highlightColor. Documented in site/agent/pages/tools/images/blog.md.

function hashStr(s: string): string {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
  return `${(h >>> 0).toString(36)}-${s.length.toString(36)}`
}

/** The image a `#new-…` hash asks for, or null. Its linkKey finds the image on a second visit. */
export function readLinkRequest(hash: string): BlogDoc | null {
  const m = /^#new-([0-9a-fA-F]+)$/.exec(hash || "")
  if (!m || m[1]!.length % 2) return null
  try {
    const hex = m[1]!.toLowerCase()
    const bytes = new Uint8Array(hex.length / 2)
    for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
    const o = JSON.parse(new TextDecoder().decode(bytes)) as unknown
    if (!o || typeof o !== "object") return null
    const r = o as Record<string, unknown>
    const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "")
    const title = str(r.title, 300).trim()
    if (!title) return null
    const d = blank()
    d.title = title
    d.hlText = str(r.highlight, 120).trim()
    d.description = str(r.description, 600).trim()
    d.author = str(r.author, 120).trim()
    if (Array.isArray(r.authors)) {
      const au = r.authors
        .map((x) => str(x, 120).trim())
        .filter(Boolean)
        .slice(0, MAX_AUTHORS)
      if (au.length) {
        d.author = au[0]!
        d.coAuthors = au.slice(1)
      }
    }
    if (typeof r.hoggie === "string" && r.hoggie.trim()) d.hog = r.hoggie.trim() // an unknown name falls back to Auto
    if (typeof r.color === "string" && r.color in TONES) d.color = r.color as ColorKey
    if (r.tone === "light" || r.tone === "mid" || r.tone === "dark") d.tone = r.tone
    if (typeof r.highlightColor === "string" && r.highlightColor in HL)
      d.highlight = r.highlightColor as HlKey
    d.linkKey = hashStr(hex)
    return d
  } catch {
    return null
  }
}
