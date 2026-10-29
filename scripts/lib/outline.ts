import fontverter from "fontverter"
import { Blob, Buffer as HbBuffer, Face, Feature, Font, shape } from "harfbuzzjs"

// Turns a line of RoundHog text into one SVG path, for artwork that has to carry its own
// lettering: a standalone SVG shown through <img> (or rasterized on a build machine) can't
// load a web font, so the glyphs go in as outlines.

/** How to set the text. `tracking` is extra space between glyphs, in em. */
export interface OutlineSpec {
  size: number
  tracking: number
  /** OpenType features, as `hb_feature_from_string` strings: "kern", "-liga". */
  features: readonly string[]
}

/** A rectangle in px, y down. */
export interface InkBox {
  x: number
  y: number
  width: number
  height: number
}

/** The outlined text: origin at the start of the baseline, y down, px. */
export interface Outline {
  d: string
  /** Pen position after the last glyph (no trailing tracking). */
  advance: number
  /** Bounding box of the glyphs' ink. */
  ink: InkBox
}

const round = (n: number): number => Math.round(n * 100) / 100 + 0

function feature(tag: string): Feature {
  const parsed = Feature.fromString(tag)
  if (!parsed) throw new Error(`Bad OpenType feature "${tag}"`)
  return parsed
}

/** Shapes `text` in a font (woff2, woff or sfnt) and returns its outlines. */
export async function outlineText(font: Buffer, text: string, spec: OutlineSpec): Promise<Outline> {
  const sfnt = await fontverter.convert(font, "sfnt")
  const face = new Face(new Blob(sfnt))
  const hbFont = new Font(face)
  const buffer = new HbBuffer()
  buffer.addText(text)
  buffer.guessSegmentProperties()
  shape(hbFont, buffer, spec.features.map(feature))

  // HarfBuzz works in font units with y up. Scale to px and flip.
  const scale = spec.size / face.upem
  const tracking = spec.tracking * spec.size
  const infos = buffer.getGlyphInfos()
  const positions = buffer.getGlyphPositions()

  let pen = 0
  let d = ""
  let [left, top, right, bottom] = [Infinity, Infinity, -Infinity, -Infinity]
  for (const [i, info] of infos.entries()) {
    const position = positions[i]
    if (!position) continue
    const gid = info.codepoint
    const dx = pen + position.xOffset * scale
    const dy = -position.yOffset * scale
    for (const { type, values } of hbFont.glyphToJson(gid)) {
      const points: number[] = []
      for (let v = 0; v + 1 < values.length; v += 2) {
        points.push(round(dx + (values[v] ?? 0) * scale), round(dy - (values[v + 1] ?? 0) * scale))
      }
      d += type + points.join(" ")
    }
    const extents = hbFont.glyphExtents(gid)
    if (extents && extents.width !== 0) {
      left = Math.min(left, dx + extents.xBearing * scale)
      right = Math.max(right, dx + (extents.xBearing + extents.width) * scale)
      top = Math.min(top, dy - extents.yBearing * scale)
      bottom = Math.max(bottom, dy - (extents.yBearing + extents.height) * scale)
    }
    pen += position.xAdvance * scale + (i < infos.length - 1 ? tracking : 0)
  }

  return {
    d,
    advance: round(pen),
    ink: {
      x: round(left),
      y: round(top),
      width: round(right - left),
      height: round(bottom - top),
    },
  }
}
