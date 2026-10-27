import fontverter from "fontverter"
import { Blob, Face } from "harfbuzzjs"
import subsetFont from "subset-font"

// RoundHog is cut into subsets by script. Their ranges don't overlap, so a browser loads
// each subset only when the page shows one of its characters, and never the full face:
// a Cyrillic name on a Latin page costs the Latin subset plus the small Cyrillic one.

type Ranges = ReadonlyArray<readonly [number, number]>

/**
 * Each subset's target characters, as inclusive ranges. A codepoint goes to the first
 * subset that lists it, and every codepoint the font has that no subset lists goes to
 * a last subset, `rest`.
 */
export const SUBSET_TARGETS: ReadonlyArray<{ readonly name: string; readonly ranges: Ranges }> = [
  {
    // The Latin block set Google Fonts uses for its `latin` subset, plus every combining
    // mark, so a letter and its accent load from the same file, and the arrow, math,
    // keyboard (⌘ ⌥), box drawing and dingbat blocks that PostHog's UI shows.
    name: "latin",
    ranges: [
      [0x0000, 0x00ff],
      [0x0131, 0x0131],
      [0x0152, 0x0153],
      [0x02bb, 0x02bc],
      [0x02c6, 0x02c6],
      [0x02da, 0x02da],
      [0x02dc, 0x02dc],
      [0x0300, 0x036f],
      [0x2000, 0x206f],
      [0x20ac, 0x20ac],
      [0x2122, 0x2122],
      [0x2190, 0x23ff],
      [0x2500, 0x27bf],
      [0xfeff, 0xfeff],
      [0xfffd, 0xfffd],
    ],
  },
  {
    // Latin Extended-A/B, IPA, spacing modifiers, phonetic extensions, Latin Extended
    // Additional (Vietnamese), Latin Extended-C/D, and currency signs.
    name: "latin-ext",
    ranges: [
      [0x0100, 0x02ff],
      [0x1d00, 0x1dff],
      [0x1e00, 0x1eff],
      [0x20a0, 0x20cf],
      [0x2c60, 0x2c7f],
      [0xa720, 0xa7ff],
    ],
  },
  {
    name: "greek",
    ranges: [
      [0x0370, 0x03ff],
      [0x1f00, 0x1fff],
    ],
  },
  {
    name: "cyrillic",
    ranges: [
      [0x0400, 0x052f],
      [0x1c80, 0x1c8f],
      [0x2de0, 0x2dff],
      [0xa640, 0xa69f],
    ],
  },
]

/** One subset of a face: its name, the codepoints it has, and the woff2 file. */
export interface CutSubset {
  name: string
  codepoints: number[]
  woff2: Buffer
}

/**
 * Splits a font's codepoints into the subsets of {@link SUBSET_TARGETS} plus `rest`, in
 * that order. Each codepoint lands in exactly one subset. Empty subsets are left out.
 */
export function splitCodepoints(codepoints: Iterable<number>): Map<string, number[]> {
  const subsets = new Map<string, number[]>()
  for (const name of [...SUBSET_TARGETS.map((t) => t.name), "rest"]) subsets.set(name, [])
  for (const cp of [...new Set(codepoints)].sort((a, b) => a - b)) {
    const target = SUBSET_TARGETS.find((t) => t.ranges.some(([s, e]) => cp >= s && cp <= e))
    subsets.get(target?.name ?? "rest")?.push(cp)
  }
  for (const [name, cps] of subsets) if (cps.length === 0) subsets.delete(name)
  return subsets
}

/** CSS `unicode-range` for a set of codepoints, with runs collapsed, e.g. "U+20-7E, U+A0". */
export function toUnicodeRange(codepoints: Iterable<number>): string {
  const runs: Array<[number, number]> = []
  for (const cp of [...new Set(codepoints)].sort((a, b) => a - b)) {
    const last = runs.at(-1)
    if (last && last[1] === cp - 1) last[1] = cp
    else runs.push([cp, cp])
  }
  const hex = (cp: number): string => cp.toString(16).toUpperCase()
  return runs
    .map(([start, end]) => (start === end ? `U+${hex(start)}` : `U+${hex(start)}-${hex(end)}`))
    .join(", ")
}

/** Every codepoint a font file maps to a glyph, sorted. Accepts woff2, woff or sfnt. */
export async function fontCodepoints(font: Buffer): Promise<number[]> {
  const sfnt = await fontverter.convert(font, "sfnt")
  return [...new Face(new Blob(sfnt)).collectUnicodes()].sort((a, b) => a - b)
}

/** Cuts a full face into its subsets, as woff2. */
export async function cutSubsets(font: Buffer): Promise<CutSubset[]> {
  const subsets: CutSubset[] = []
  for (const [name, codepoints] of splitCodepoints(await fontCodepoints(font))) {
    const woff2 = await subsetFont(font, String.fromCodePoint(...codepoints), {
      targetFormat: "woff2",
    })
    subsets.push({ name, codepoints, woff2 })
  }
  return subsets
}
