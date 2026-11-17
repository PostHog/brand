// Build mode images: one design on the blueprint grid, exported at four sizes. This is the
// document a build mode image saves, and the facts about each size.

import { clamp } from "../../editor/canvas.ts"
import type { Stamped } from "../../editor/store.ts"
import data from "../../data/build.json"

export const ASSETS: {
  buildLogo: string
  rip: string
  /** Author name → photo. To add a person, add their photo and a line here. */
  authors: Record<string, string>
} = data

export type FormatKey = "LinkedIn" | "Website" | "X" | "Substack"

export interface Format {
  w: number
  h: number
  author: boolean
  rip: boolean
  logo: boolean
  /** The file name's suffix. */
  file: string
  /** Per-size adjustments to the 1920 × 1080 layout. */
  tune?: {
    author?: number
    logo?: number
    grid?: number
    title?: number
    logoInset?: number
    padX?: number
  }
}

export const FORMATS: Record<FormatKey, Format> = {
  LinkedIn: { w: 1920, h: 1080, author: true, rip: true, logo: true, file: "linkedin" },
  Website: { w: 1920, h: 1080, author: false, rip: false, logo: true, file: "website" },
  X: {
    w: 1500,
    h: 600,
    author: true,
    rip: true,
    logo: true,
    file: "x",
    tune: { author: 1.45, logo: 1.45, grid: 1.4, title: 1.15, logoInset: 48 },
  },
  Substack: {
    w: 1200,
    h: 630,
    author: false,
    rip: false,
    logo: false,
    file: "substack",
    tune: { grid: 1.2, padX: 170 },
  },
}

export const ORDER: FormatKey[] = ["LinkedIn", "Website", "X", "Substack"]

/** Highlight colors: [ink, box]. */
export const HL = {
  teal: ["hsl(165, 67%, 56%)", "hsla(165, 67%, 56%, 0.2)"],
  purple: ["hsl(283, 63%, 52%)", "hsla(283, 63%, 52%, 0.2)"],
  tangerine: ["hsl(17, 100%, 55%)", "hsla(17, 100%, 55%, 0.2)"],
  blue: ["hsl(205, 84%, 49%)", "hsla(205, 84%, 49%, 0.2)"],
} as const satisfies Record<string, readonly [string, string]>
export type HlKey = keyof typeof HL
export const HL_KEYS = Object.keys(HL) as HlKey[]

/** The image's position and size for one size of the export, on top of the shared settings. */
export interface Fit {
  size: number
  x: number
  y: number
  r: number
}

export interface BuildDoc extends Stamped {
  title: string
  /** The phrase in the title to highlight. */
  hlText: string
  highlight: HlKey
  author: string
  /** Up to two more authors, one row each. */
  coAuthors?: string[]
  /** The uploaded image (an object URL, so it lives only in this tab). */
  imgId: string
  imgName: string
  imgSize: number
  imgX: number
  imgY: number
  flip: boolean
  fit: Partial<Record<FormatKey, Partial<Fit>>>
  gridSize: number
  showRip: boolean
  showLogo: boolean
  logoSize: number
}

export const MAX_AUTHORS = 3

export function authorNames(): string[] {
  return Object.keys(ASSETS.authors)
}

export function blank(): BuildDoc {
  const now = Date.now()
  return {
    title: "The end of engineers?",
    hlText: "engineers?",
    highlight: "purple",
    author: "Ian Vanagas",
    imgId: "",
    imgName: "",
    imgSize: 100,
    imgX: 0,
    imgY: 0,
    flip: false,
    fit: {},
    gridSize: 64,
    showRip: true,
    showLogo: true,
    logoSize: 120,
    createdAt: now,
    updatedAt: now,
  }
}

export function plainTitle(d: BuildDoc): string {
  return (
    String(d.title || "")
      .replace(/\s*[\n|]\s*/g, " ")
      .trim() || "Untitled post"
  )
}

/** The main author plus co-authors, without repeats. */
export function authorsOf(d: BuildDoc): string[] {
  const seen = new Set<string>()
  return [d.author, ...(d.coAuthors ?? [])].filter((a) => {
    if (!a || seen.has(a)) return false
    seen.add(a)
    return true
  })
}

export function authorLabel(d: BuildDoc): string {
  return authorsOf(d).join(", ") || "No author"
}

export function fitOf(d: BuildDoc, fmt: FormatKey): Fit {
  const f = d.fit?.[fmt] ?? {}
  return {
    size: clamp(f.size, 25, 200, 100),
    x: clamp(f.x, -600, 600, 0),
    y: clamp(f.y, -600, 600, 0),
    r: clamp(f.r, -180, 180, 0),
  }
}

/** What a size leaves out, as a note under the stage ("No author or paper rip on this size"). */
export function sizeNote(fmt: FormatKey): string {
  const F = FORMATS[fmt]
  const hide: string[] = []
  if (!F.author) hide.push("author")
  if (!F.rip) hide.push("paper rip")
  if (!F.logo) hide.push("logo")
  return hide.length ? `No ${hide.join(", ").replace(/, ([^,]*)$/, " or $1")} on this size` : ""
}
