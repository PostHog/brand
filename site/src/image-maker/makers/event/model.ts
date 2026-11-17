// Event images: a square post with a headline, a calendar tile, the time and place, a hoggie or
// your own picture, and partner logos in the footer. This is the document an event image saves.

import type { Stamped } from "../../editor/store.ts"
import data from "../../data/event.json"

export const ASSETS: {
  /** Squeak Bold, the headline face (from the PostHog brand book). */
  squeak: string
  logos: { black: string; white: string }
} = data

/** Brand colors as [hue, saturation, 500 lightness, 700 lightness]. */
export const BRAND = {
  blue: [205, 84, 49, 38],
  yellow: [37, 100, 55, 45],
  teal: [165, 67, 56, 44],
  purple: [283, 63, 52, 42],
  "corn-blue": [195, 74, 52, 39],
  coral: [358, 100, 64, 47],
  tangerine: [17, 100, 55, 50],
  lime: [75, 72, 46, 40],
  green: [132, 54, 53, 45],
  violet: [250, 100, 65, 59],
  cobalt: [220, 100, 51, 41],
  lemon: [47, 100, 55, 47],
} as const satisfies Record<string, readonly [number, number, number, number]>
export type ColorKey = keyof typeof BRAND
export const COLOR_KEYS = Object.keys(BRAND) as ColorKey[]
export type FooterKey = ColorKey | "white"

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]
export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

/** Relative luminance of an HSL color (WCAG). */
function lum(h: number, s: number, l: number): number {
  s /= 100
  l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    return l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)))
  }
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
  return 0.2126 * lin(f(0)) + 0.7152 * lin(f(8)) + 0.0722 * lin(f(4))
}

export interface Swatch {
  css: string
  /** White text reads on it (contrast ≥ 3). */
  light: boolean
}

/** A brand color at its 500 (default) or 700 step. */
export function swatch(key: string, step: 500 | 700): Swatch {
  const c = BRAND[key as ColorKey] ?? BRAND.blue
  const l = step === 700 ? c[3] : c[2]
  return { css: `hsl(${c[0]}, ${c[1]}%, ${l}%)`, light: 1.05 / (lum(c[0], c[1], l) + 0.05) >= 3 }
}

export function footSwatch(key: string): Swatch {
  return key === "white" ? { css: "#ffffff", light: false } : swatch(key, 500)
}

export interface EventPhoto {
  /** An object URL, so it lives only in this tab. */
  id: string
  name: string
  size: number
  x: number
  y: number
  flip: boolean
  /** Drawn in front of the hoggie (else behind it). */
  front: boolean
}

export interface EventLogo {
  /** An object URL, so it lives only in this tab. */
  id: string
  name: string
}

export interface EventDoc extends Stamped {
  /** The headline. `**words**` are bold; with any marked, the rest go lighter and smaller. */
  title: string
  /** "fit": each line fills the width. "even": lines share one size. */
  headline: "fit" | "even"
  /** YYYY-MM-DD */
  date: string
  /** HH:MM */
  start: string
  end: string
  tz: string
  location: string
  bg: ColorKey
  cal: ColorKey
  footer: FooterKey
  /** A hoggie's name, or "" for none. */
  hog: string
  hogSize: number
  hogX: number
  hogY: number
  flip: boolean
  hlScale: number
  glow: boolean
  logos: EventLogo[]
  darkText?: boolean
  calFlip?: boolean
  logoColor?: "auto" | "white" | "black"
  photo?: EventPhoto | null
}

export const MAX_LOGOS = 4

function isoPlus(days: number): string {
  const t = new Date()
  t.setDate(t.getDate() + days)
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`
}

export function blank(): EventDoc {
  const now = Date.now()
  return {
    title: "Your event\ntitle goes\nhere",
    headline: "fit",
    date: isoPlus(14),
    start: "18:00",
    end: "21:00",
    tz: "",
    location: "Venue, City",
    bg: "blue",
    cal: "tangerine",
    footer: "white",
    hog: "",
    hogSize: 100,
    hogX: 0,
    hogY: 0,
    flip: false,
    hlScale: 100,
    glow: false,
    logos: [],
    createdAt: now,
    updatedAt: now,
  }
}

export function parseDate(iso: string | undefined): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? "")
  return m ? new Date(+m[1]!, +m[2]! - 1, +m[3]!) : null
}

function fmtTime(t: string | undefined): string {
  const m = /^(\d{1,2}):(\d{2})/.exec(t ?? "")
  if (!m) return ""
  let h = +m[1]!
  const ap = h >= 12 ? "PM" : "AM"
  h = h % 12
  if (h === 0) h = 12
  return `${h}:${m[2]} ${ap}`
}

/** "6:00 PM – 9:00 PM PT", or "" without times. */
export function timeLine(d: EventDoc): string {
  const s = fmtTime(d.start)
  const e = fmtTime(d.end)
  const t = s && e ? `${s} – ${e}` : s || e
  if (!t) return ""
  const tz = (d.tz ?? "").trim()
  return tz ? `${t} ${tz}` : t
}

/** The whole headline on one line (line breaks become spaces). */
export function firstLine(d: EventDoc): string {
  return (
    String(d.title || "")
      .replace(/\*\*/g, "")
      .split(/\n|\|/)
      .map((t) => t.trim())
      .filter(Boolean)
      .join(" ") || "Untitled event"
  )
}

export function shortDate(d: EventDoc): string {
  const dt = parseDate(d.date)
  return dt
    ? `${DAYS[dt.getDay()]}, ${MONTHS[dt.getMonth()]!.slice(0, 3)} ${dt.getDate()}`
    : "No date"
}

export function hasPhoto(d: EventDoc): d is EventDoc & { photo: EventPhoto } {
  return !!d.photo?.id
}
