// Standalone SVG + PNG from an inline <svg> already on the page.
//
// `@posthog/brand/logo` ships only a React component — no svg/png exports — so the Logo
// page's copy menu snapshots what the component actually rendered: the same markup a
// consumer's `<Logo>` produces, made standalone (intrinsic size, no page CSS) and, for the
// PNG, rasterized in the browser.

const PNG_LONG_SIDE = 1200

/**
 * Serializes a rendered `<svg>` into a standalone document.
 *
 * - The viewBox grows to cover anything drawn outside it: the holiday hats poke past the
 *   logomark's box and the live element shows them via `overflow: visible`, but a
 *   standalone SVG (or its raster) clips at the viewBox.
 * - `currentColor` is resolved to the element's computed color, since the page CSS that
 *   supplied it doesn't travel with the copy.
 * - Page-only attributes (CSS sizing, a11y wiring, inline style) are dropped; width/height
 *   are set to the viewBox so the file has an intrinsic size.
 */
export function standaloneSvg(el: SVGSVGElement): {
  markup: string
  width: number
  height: number
} {
  const vb = el.viewBox.baseVal
  const bbox = el.getBBox()
  const x = Math.min(vb.x, bbox.x)
  const y = Math.min(vb.y, bbox.y)
  const width = Math.max(vb.x + vb.width, bbox.x + bbox.width) - x
  const height = Math.max(vb.y + vb.height, bbox.y + bbox.height) - y
  const round = (n: number) => Math.round(n * 100) / 100

  const clone = el.cloneNode(true) as SVGSVGElement
  for (const attr of ["style", "class", "role", "aria-hidden", "width", "height"]) {
    clone.removeAttribute(attr)
  }
  clone.setAttribute("viewBox", [x, y, width, height].map(round).join(" "))
  clone.setAttribute("width", String(round(width)))
  clone.setAttribute("height", String(round(height)))

  const color = getComputedStyle(el).color
  const markup = new XMLSerializer().serializeToString(clone).replaceAll("currentColor", color)
  return { markup, width, height }
}

/** Rasterizes standalone SVG markup to a PNG blob, `PNG_LONG_SIDE` px on its longer side. */
export async function svgToPng(markup: string, width: number, height: number): Promise<Blob> {
  const scale = PNG_LONG_SIDE / Math.max(width, height)
  const w = Math.round(width * scale)
  const h = Math.round(height * scale)

  const img = new Image(w, h)
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`
  await img.decode()

  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  canvas.getContext("2d")!.drawImage(img, 0, 0, w, h)
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      "image/png",
    ),
  )
}
