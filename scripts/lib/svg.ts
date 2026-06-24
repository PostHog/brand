// SVG normalization + optimization shared by sync and its tests.

import { optimize } from "svgo"

export interface OptimizedSvg {
  /** Full optimized `<svg>…</svg>` string. */
  svg: string
  /** Guaranteed-present viewBox, e.g. "0 0 600 600". */
  viewBox: string
  /** Intrinsic width / height ratio derived from the viewBox. */
  aspectRatio: number
}

const VIEWBOX_RE = /viewBox\s*=\s*["']([^"']+)["']/i
const WIDTH_RE = /\bwidth\s*=\s*["']?([\d.]+)/i
const HEIGHT_RE = /\bheight\s*=\s*["']?([\d.]+)/i

/** Reads or synthesizes a viewBox so traced SVGs (width/height only) get one. */
function ensureViewBox(raw: string): { raw: string; viewBox: string } {
  const existing = raw.match(VIEWBOX_RE)
  if (existing?.[1]) {
    return { raw, viewBox: existing[1].trim() }
  }
  const width = raw.match(WIDTH_RE)?.[1]
  const height = raw.match(HEIGHT_RE)?.[1]
  if (!width || !height) {
    throw new Error("SVG has neither viewBox nor width/height; cannot normalize.")
  }
  const viewBox = `0 0 ${width} ${height}`
  // Inject right after the opening `<svg` so SVGO sees it.
  const injected = raw.replace(/<svg\b/i, `<svg viewBox="${viewBox}"`)
  return { raw: injected, viewBox }
}

function aspectFromViewBox(viewBox: string): number {
  const parts = viewBox.split(/[\s,]+/).map(Number)
  const w = parts[2]
  const h = parts[3]
  if (!w || !h || !Number.isFinite(w) || !Number.isFinite(h)) return 1
  return w / h
}

/**
 * Optimizes a raw SVG for inlining: guarantees a viewBox, drops width/height,
 * reduces path precision, and prefixes every id with `<idPrefix>-` so two inlined
 * assets never share clip-path / gradient ids on the same page. Pass a prefix that
 * is unique across the whole library, e.g. `"<namespace>-<slug>"`.
 */
export function optimizeSvg(raw: string, idPrefix: string): OptimizedSvg {
  const { raw: withViewBox, viewBox } = ensureViewBox(raw)

  const result = optimize(withViewBox, {
    multipass: true,
    floatPrecision: 2,
    plugins: [
      {
        name: "preset-default",
        params: {
          overrides: {
            // Keep ids; prefixIds (below) namespaces them instead of dropping.
            // (SVGO v4 already preserves viewBox by default — removeViewBox is opt-in.)
            cleanupIds: false,
          },
        },
      },
      { name: "removeDimensions" },
      { name: "prefixIds", params: { prefix: idPrefix, delim: "-" } },
    ],
  })

  return { svg: result.data, viewBox, aspectRatio: aspectFromViewBox(viewBox) }
}

/** Extracts the inner markup of an `<svg>` element (drops the wrapper tag). */
export function svgBody(svg: string): string {
  const open = svg.indexOf(">", svg.indexOf("<svg"))
  const close = svg.lastIndexOf("</svg>")
  if (open === -1 || close === -1) {
    throw new Error("Malformed SVG: missing <svg> wrapper.")
  }
  return svg.slice(open + 1, close).trim()
}
