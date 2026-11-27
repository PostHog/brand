// The hoggies the makers offer, read from the package the site is built from. A hoggie the daily
// sync adds shows up in every maker on the next deploy, and each one points at a file this build
// serves (/hoggies/<stem>.svg), so a saved image can't name a hoggie that 404s.

import { findAssets, getVariants } from "@posthog/brand"
import { assetFilePath, hoggieStem } from "../agent-paths.ts"
import topics from "./data/hoggie-topics.json"

/** What a maker reads per hoggie: its SVG and the `|`-joined words it matches on. */
export interface MakerHoggie {
  id: string
  /** The package's tags plus the hoggie's name. Gallery search, and auto-match at weight 1. */
  tags: string
  /** Hand-picked post topics (data/hoggie-topics.json, keyed by file stem). Weight 3. */
  topics: string
}

// Tags on nearly every hoggie, which would make every title match every hoggie.
const GENERIC_TAGS = new Set(["hog", "hogs", "hedgehog", "solo", "group", "naked"])

const TOPICS: Record<string, string> = topics

function words(list: string[]): string {
  const out = new Set<string>()
  for (const word of list) {
    const w = word.toLowerCase().replace(/-/g, " ").trim()
    if (w && !GENERIC_TAGS.has(w)) out.add(w)
  }
  return [...out].join("|")
}

let cached: Record<string, MakerHoggie> | null = null

/**
 * Every hoggie by display name. A variant family's first member keeps the family name and the
 * others add their key ("Noir", "Noir 2" …), which is what saved images store.
 */
export function makerHoggies(): Record<string, MakerHoggie> {
  if (cached) return cached
  const hogs: Record<string, MakerHoggie> = {}
  const seen = new Set<string>()
  for (const { slug } of findAssets({ namespace: "hoggies" })) {
    if (seen.has(slug)) continue
    seen.add(slug)
    getVariants("hoggies", slug).forEach((member, i) => {
      const key = member.variant?.variant
      const name = i === 0 ? member.name : `${member.name} ${key}`
      const stem = hoggieStem(slug, key)
      hogs[name] = {
        id: assetFilePath({ type: "hoggie", slug, variant: key }, "svg"),
        tags: words([...(member.tags ?? []), member.name]),
        topics: TOPICS[stem] ?? "",
      }
    })
  }
  cached = hogs
  return hogs
}

/**
 * The maker name of the hoggie a request names, or "" if there's none: its name ("Burning
 * Money", "Noir 2"), in any case, or its file stem ("burning-money", "noir-2").
 */
export function findHoggie(query: unknown): string {
  if (typeof query !== "string" || !query.trim()) return ""
  const hogs = makerHoggies()
  const q = query.trim()
  if (hogs[q]) return q
  const lower = q.toLowerCase()
  const stem = lower.replace(/\.(svg|png)$/, "").replace(/^.*\//, "")
  for (const [name, hog] of Object.entries(hogs)) {
    if (name.toLowerCase() === lower) return name
    if (hog.id.endsWith(`/${stem}.svg`)) return name
  }
  return ""
}
