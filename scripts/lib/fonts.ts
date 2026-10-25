import fontverter from "fontverter"
import { Blob, Face } from "harfbuzzjs"

// The Latin subset of RoundHog: the characters most PostHog text uses. Browsers load
// the small subset file for these and fetch the full face only for other scripts.

/**
 * The Latin block set Google Fonts uses for its `latin` subset, plus every combining mark
 * (U+0300-036F) so a letter and its accent load from the same file. Inclusive ranges.
 */
export const LATIN_TARGET_RANGES: ReadonlyArray<readonly [number, number]> = [
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
  [0x2191, 0x2191],
  [0x2193, 0x2193],
  [0x2212, 0x2212],
  [0x2215, 0x2215],
  [0xfeff, 0xfeff],
  [0xfffd, 0xfffd],
]

export function codepointsInRanges(ranges: ReadonlyArray<readonly [number, number]>): Set<number> {
  const codepoints = new Set<number>()
  for (const [start, end] of ranges) for (let cp = start; cp <= end; cp++) codepoints.add(cp)
  return codepoints
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
