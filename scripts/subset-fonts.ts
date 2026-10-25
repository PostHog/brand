// Writes the Latin subset of every RoundHog face to assets/fonts/latin/, and prints the
// `unicode-range` that src/fonts/roundhog.ts must declare for them.
// Run with `pnpm fonts:subset` after a face in assets/fonts/ changes.

import { readdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import {
  LATIN_TARGET_RANGES,
  codepointsInRanges,
  fontCodepoints,
  latinSubset,
  toUnicodeRange,
} from "./lib/fonts.ts"

const FONTS = join(import.meta.dirname, "..", "assets", "fonts")
const latin = codepointsInRanges(LATIN_TARGET_RANGES)

const ranges = new Set<string>()
for (const file of readdirSync(FONTS).filter((f) => f.endsWith(".woff2"))) {
  const full = readFileSync(join(FONTS, file))
  writeFileSync(join(FONTS, "latin", file), await latinSubset(full))
  ranges.add(toUnicodeRange((await fontCodepoints(full)).filter((cp) => latin.has(cp))))
}

if (ranges.size !== 1)
  throw new Error("The faces cover different Latin characters; declare one range per face.")
console.log([...ranges][0])
