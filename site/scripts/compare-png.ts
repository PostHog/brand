// Compares a downloaded image maker PNG with its reference snapshot in tests/makers/, or saves a
// download as the new reference. See tests/makers/README.md.
//
//   node scripts/compare-png.ts <reference.png> <download.png>          prints Match or how much differs
//   node scripts/compare-png.ts --save <download.png> <reference.png>   stores it as the reference
//
// References are kept at half size, so a full-size download is scaled to match.

import { mkdirSync } from "node:fs"
import { dirname } from "node:path"
import sharp from "sharp"

const args = process.argv.slice(2)
const save = args[0] === "--save"
const [first, second] = save ? args.slice(1) : args
if (!first || !second) {
  console.error(
    "Usage: node scripts/compare-png.ts <reference.png> <download.png>\n" +
      "       node scripts/compare-png.ts --save <download.png> <reference.png>",
  )
  process.exit(2)
}

if (save) {
  const meta = await sharp(first).metadata()
  mkdirSync(dirname(second), { recursive: true })
  await sharp(first)
    .resize({ width: Math.round((meta.width ?? 2) / 2) })
    .png({ compressionLevel: 9 })
    .toFile(second)
  console.log(`Saved ${second}`)
  process.exit(0)
}

const ref = await sharp(first).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const { width, height } = ref.info
const img = await sharp(second)
  .resize({ width, height, fit: "fill" })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true })

let differ = 0
for (let i = 0; i < ref.data.length; i += 4) {
  for (let c = 0; c < 4; c++) {
    if (ref.data[i + c] !== img.data[i + c]) {
      differ++
      break
    }
  }
}

if (!differ) {
  console.log(`Match: all ${width * height} pixels are the same.`)
  process.exit(0)
}
const share = ((100 * differ) / (width * height)).toFixed(2)
console.log(`Different: ${differ} of ${width * height} pixels (${share}%).`)
process.exit(1)
