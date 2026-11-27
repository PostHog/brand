// Blog images: post and newsletter headers, 1920 × 1080. This is the document a blog image saves,
// its colors, and how the hoggie is picked when the author leaves it to the maker.

import { findHoggie, type MakerHoggie, makerHoggies } from "../../hoggies.ts"
import {
  names,
  oneOf,
  placeHoggie,
  readHashRequest,
  type Request,
  str,
} from "../../editor/request.ts"
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
  /** The hoggie Auto falls back to when nothing in the title matches. Picked at random for each
   *  new image, so unmatched titles don't all get the same hoggie. Older images: Hogpatch. */
  fallbackHog?: string
}

export const MAX_AUTHORS = 3

// New images start from a random look, so headers don't all come out the same. Only readable
// combos: on Light, purple or blue highlights (blue only on a background that isn't blue); on Dark,
// teal, green or white; Midtone only where the text holds up (white text on purple, violet and
// cobalt; dark text with purple on lemon). Light is picked most often.
type Look = Pick<BlogDoc, "color" | "tone" | "midText" | "highlight">
const BLUES: ColorKey[] = ["blue", "corn-blue", "cobalt"]
const MID_LOOKS: Look[] = [
  { color: "purple", tone: "mid", midText: "white", highlight: "white" },
  { color: "violet", tone: "mid", midText: "white", highlight: "white" },
  { color: "cobalt", tone: "mid", midText: "white", highlight: "white" },
  { color: "lemon", tone: "mid", midText: "dark", highlight: "purple" },
]
const TONE_ODDS = { light: 0.6, mid: 0.2 } // dark gets the rest (0.2)

function pick<T>(list: readonly T[], rand: () => number): T {
  return list[Math.floor(rand() * list.length)]!
}

export function randomLook(rand: () => number = Math.random): Look {
  const r = rand()
  if (r < TONE_ODDS.light) {
    const color = pick(COLOR_KEYS, rand)
    const hl: HlKey[] = BLUES.includes(color) ? ["purple"] : ["purple", "blue"]
    return { color, tone: "light", midText: "dark", highlight: pick(hl, rand) }
  }
  if (r < TONE_ODDS.light + TONE_ODDS.mid) return { ...pick(MID_LOOKS, rand) }
  return {
    color: pick(COLOR_KEYS, rand),
    tone: "dark",
    midText: "dark",
    highlight: pick(["teal", "green", "white"] as HlKey[], rand),
  }
}

/** A random hoggie for Auto to fall back on: one with hand-picked blog topics, so it suits a post. */
export function randomFallbackHog(rand: () => number = Math.random): string {
  const all = hogs()
  const pool = Object.keys(all).filter((n) => all[n]!.topics)
  return pool.length ? pick(pool, rand) : FALLBACK_HOG
}

/** A new image from the New button. The fallback hoggie is set here, not in blank(): saved images
 *  are restored over blank(), and one from before this field must keep falling back to Hogpatch. */
export function fresh(): BlogDoc {
  // Starts untitled: the hoggie asks for a title in a speech bubble until there is one.
  return { ...blank(), title: "", hlText: "", fallbackHog: randomFallbackHog() }
}

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
    ...randomLook(),
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
  const fallback = d.fallbackHog && kw[d.fallbackHog] ? d.fallbackHog : FALLBACK_HOG
  let best = d.seo ? (pool[0] ?? FALLBACK_HOG) : fallback
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

// ---- Requests: a new image from a JSON object of settings (for agents and scripts) ----
// Keys: title (required), description, highlight, author (or authors: [..] up to 3), hoggie,
// color, tone, textColor, highlightColor, seo. They arrive as a `#new-<hex>` link (documented in
// site/agent/pages/tools/images/blog.md) or as the make_blog_image WebMCP tool's input.

/** The image a request asks for, or why it can't make one. */
export function fromRequest(r: Request): BlogDoc | string {
  const title = str(r.title, 300)
  if (!title) return "A title is required."
  const d = blank()
  d.title = title
  d.hlText = str(r.highlight, 120)
  d.description = str(r.description, 600)
  const authors = names(r, MAX_AUTHORS)
  d.author = authors[0] ?? ""
  if (authors.length > 1) d.coAuthors = authors.slice(1)
  d.hog = findHoggie(r.hoggie) || d.hog // an unknown name stays on Auto
  placeHoggie(d, r, [75, 125], 20)
  d.color = oneOf(r.color, COLOR_KEYS) ?? d.color
  d.tone = oneOf(r.tone, ["light", "mid", "dark"] as const) ?? d.tone
  d.midText = oneOf(r.textColor, ["dark", "white"] as const) ?? d.midText
  d.highlight = oneOf(r.highlightColor, HL_KEYS) ?? d.highlight
  if (r.seo === true) d.seo = true
  // White only reads on white text.
  if (d.highlight === "white" && !whiteHlAllowed(d)) d.highlight = "purple"
  return d
}

/** The image a `#new-…` hash asks for, or null. Its linkKey finds the image on a second visit. */
export function readLinkRequest(hash: string): BlogDoc | null {
  const link = readHashRequest(hash)
  const d = link && fromRequest(link.request)
  if (!d || typeof d === "string") return null
  d.linkKey = link.linkKey
  return d
}
