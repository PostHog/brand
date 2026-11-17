// Customer story images: the company's logo from posthog.com/customers (or an upload), a hoggie
// and brand colors on one 1920 × 1080 header. This is the document a customer story image saves,
// the company lookup and the automatic hoggie.

import { makerHoggies } from "../../hoggies.ts"
import type { Stamped } from "../../editor/store.ts"
import data from "../../data/customer.json"

export const W = 1920
export const H = 1080

/** A company on posthog.com/customers. */
export interface Customer {
  name: string
  slug: string
  industries: string[]
  aliases?: string[]
  /** Logo files: `light` reads on light backgrounds, `dark` on dark ones. */
  light?: string
  dark?: string
  /** The logo color mode that suits this logo best. */
  prefer?: "match" | "original"
  /** A hoggie picked for this company by hand. */
  hog?: string
}

export const CUSTOMERS: Customer[] = data.customers as Customer[]
/** [hoggie, `|`-separated words]: the first theme whose word is in the company's name or industries wins. */
const THEMES: [string, string][] = data.themes as [string, string][]

// [300, 500, 700]
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

/** These colors have no dark tone in the template: Dark falls back to Midtone. */
const NO_DARK = new Set<ColorKey>(["yellow", "coral", "tangerine", "lemon", "lime"])

export type Tone = "light" | "mid" | "dark"
export type LogoMode = "match" | "original"

export const AUTO = "Auto (match company)"
const FALLBACK_HOG = "Hand Clasp"

export interface Upload {
  /** An object URL, so it lives only in this tab. */
  id: string
  name: string
}

export interface CustomerDoc extends Stamped {
  /** What was typed: a name or a website. */
  company: string
  /** The posthog.com/customers entry the last "Find logo" picked (its slug), or "". */
  lib: string
  upload: Upload | null
  /** "" follows the customer's preferred mode (else "match"). */
  logoMode: LogoMode | ""
  logoSize: number
  /** A hoggie's name, or AUTO. */
  hog: string
  hogSize: number
  hogX: number
  hogY: number
  flip: boolean
  color: ColorKey
  tone: Tone
  ink: "light" | "dark"
  /** Set on images made from a `#new-…` link: look the company up when the image opens. */
  findOnOpen?: boolean
}

export function blank(): CustomerDoc {
  const now = Date.now()
  return {
    company: "SoundBoost",
    lib: "soundboost",
    upload: null,
    logoMode: "",
    logoSize: 100,
    hog: AUTO,
    hogSize: 100,
    hogX: 0,
    hogY: 0,
    flip: false,
    color: "blue",
    tone: "mid",
    ink: "light",
    createdAt: now,
    updatedAt: now,
  }
}

// ---- Company → name, library logo, auto hoggie ----

/** Lowercase letters and digits only, for matching names. */
export function key(s: string | undefined | null): string {
  return String(s ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
}

export function parseCompany(company: string | undefined | null) {
  const raw = String(company ?? "").trim()
  const host = raw
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, "")
    .replace(/^www\./, "")
    .split(/[/?#]/)[0]!
  const isUrl = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host) && !raw.includes(" ")
  return {
    raw,
    host: isUrl ? host : "",
    stem: isUrl ? host.split(".")[0]! : raw,
    display: isUrl ? host : raw || "[Company]",
  }
}

export function bySlug(slug: string): Customer | null {
  return CUSTOMERS.find((c) => c.slug === slug) ?? null
}

/** The customer picked by the last "Find logo" (stored on the image as `lib`). */
export function customerFor(d: CustomerDoc): Customer | null {
  return d.lib ? bySlug(d.lib) : null
}

export function customerKeys(c: Customer): string[] {
  return [c.slug, c.name, ...(c.aliases ?? [])].map(key)
}

let custIndex: Map<string, Customer> | null = null

/**
 * Looks the company up in the posthog.com/customers list: exact name, slug or website match
 * first, then partial matches (several come back as choices).
 */
export function searchCustomers(company: string): { exact: Customer | null; near: Customer[] } {
  if (!custIndex) {
    custIndex = new Map()
    for (const c of CUSTOMERS) for (const k of customerKeys(c)) if (k) custIndex.set(k, c)
  }
  const p = parseCompany(company)
  const q1 = key(p.stem)
  const q2 = key(p.raw)
  const exact = custIndex.get(q1) ?? custIndex.get(q2)
  if (exact) return { exact, near: [] }
  const near: Customer[] = []
  if (q1.length >= 3)
    for (const c of CUSTOMERS)
      if (customerKeys(c).some((k) => k.includes(q1) || (k.length >= 3 && q1.includes(k))))
        near.push(c)
  return { exact: null, near: near.slice(0, 6) }
}

export function displayName(d: CustomerDoc): string {
  return customerFor(d)?.name ?? parseCompany(d.company).display
}

/** The hoggie the company suggests: the customer's own, else the first theme its words match. */
export function autoHog(d: CustomerDoc): string {
  const hogs = makerHoggies()
  const c = customerFor(d)
  if (c?.hog && hogs[c.hog]) return c.hog
  const p = parseCompany(d.company)
  const hay = ` ${`${p.raw} ${p.host.replace(/\./g, " ")} ${c ? c.industries.join(" ") : ""}`
    .toLowerCase()
    .replace(/[^a-z0-9+ ]+/g, " ")
    .replace(/\s+/g, " ")} `
  for (const [hog, words] of THEMES)
    for (const w of words.split("|")) if (hay.includes(` ${w} `) && hogs[hog]) return hog
  return hogs[FALLBACK_HOG] ? FALLBACK_HOG : Object.keys(hogs)[0]!
}

export function isAuto(d: CustomerDoc): boolean {
  return !d.hog || d.hog === AUTO
}

export function resolvedHog(d: CustomerDoc): string {
  return isAuto(d) || !makerHoggies()[d.hog] ? autoHog(d) : d.hog
}

export function hogUrl(name: string): string {
  return makerHoggies()[name]?.id ?? ""
}

export interface LogoInfo {
  src: "upload" | "library" | "none"
  id?: string
  mode: LogoMode
  customer: Customer | null
}

/** Where the logo comes from: an upload wins over the library. */
export function logoInfo(d: CustomerDoc, lightText: boolean): LogoInfo {
  const c = customerFor(d)
  const mode: LogoMode =
    d.logoMode === "match" || d.logoMode === "original"
      ? d.logoMode
      : (!d.upload && c?.prefer) || "match"
  if (d.upload?.id) return { src: "upload", id: d.upload.id, mode, customer: c }
  if (c?.light)
    return {
      src: "library",
      id: mode === "original" && lightText ? c.dark || c.light : c.light,
      mode,
      customer: c,
    }
  return { src: "none", mode, customer: c }
}

export function logoLabel(d: CustomerDoc): string {
  return d.upload?.id ? "Uploaded logo" : customerFor(d) ? "posthog.com logo" : "No logo yet"
}

export interface Look {
  tone: Tone
  base: string
  wash: string | null
  text: string
  lightText: boolean
}

export function look(d: CustomerDoc): Look {
  const colorKey: ColorKey = TONES[d.color] ? d.color : "blue"
  const t = TONES[colorKey]
  let tone: Tone = d.tone === "light" || d.tone === "dark" ? d.tone : "mid"
  if (tone === "dark" && NO_DARK.has(colorKey)) tone = "mid"
  const lightText = d.ink !== "dark"
  return {
    tone,
    base: tone === "mid" ? t[1] : tone === "dark" ? t[2] : t[0],
    wash:
      tone === "mid"
        ? null
        : tone === "dark"
          ? "rgba(30, 31, 35, 0.7)"
          : "rgba(255, 255, 255, 0.7)",
    text: lightText ? "#ffffff" : "#1e1f23",
    lightText,
  }
}

// ---- Links that make an image (for agents and scripts) ----

function hashStr(s: string): string {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
  return `${(h >>> 0).toString(36)}-${s.length.toString(36)}`
}

/**
 * `#new-<hex>`: hex-encoded UTF-8 JSON that makes a new image when the page opens. Keys: company
 * (required), hoggie, color, tone, ink. The company is looked up when the image opens.
 */
export function readLinkRequest(hash: string): CustomerDoc | null {
  const m = /^#new-([0-9a-fA-F]+)$/.exec(hash)
  if (!m || m[1]!.length % 2) return null
  try {
    const hex = m[1]!.toLowerCase()
    const bytes = new Uint8Array(hex.length / 2)
    for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
    const o = JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown> | null
    if (!o || typeof o !== "object" || typeof o.company !== "string" || !o.company.trim())
      return null
    const d = blank()
    d.company = o.company.trim().slice(0, 200)
    d.lib = ""
    d.findOnOpen = true
    if (typeof o.hoggie === "string" && o.hoggie.trim()) d.hog = o.hoggie.trim()
    if (typeof o.color === "string" && o.color in TONES) d.color = o.color as ColorKey
    if (o.tone === "light" || o.tone === "mid" || o.tone === "dark") d.tone = o.tone
    if (o.ink === "light" || o.ink === "dark") d.ink = o.ink
    d.linkKey = hashStr(hex)
    return d
  } catch {
    return null
  }
}
