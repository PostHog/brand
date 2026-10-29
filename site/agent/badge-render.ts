// The "Built with PostHog" website badges as standalone SVGs and PNGs. Other sites show them
// through <img>, where nothing outside the file loads, so each one is self-contained: the
// logo from the same geometry <Logo> renders (`src/logo/geometry.ts` at the repo root), and
// the lettering as a RoundHog outline (`src/badge-text.ts`).
//
// Layout, in px (the viewBox is the intrinsic size): a 100×50 plate, the logo 80×14 at (10, 26),
// and "Built with" centered on its ink with its baseline at 16.5. The brand handbook asks for
// clear space around the logo of at least the height of its "P": 18.88 of its 28 units, so
// 9.44 px at this size. The logo gets 10 px to the plate's edges and 9.5 px to the lettering,
// and the lettering's ink starts about 10 px from the top, so the margins match all round.

import { LOGO_BODY } from "../../src/logo/geometry.ts"
import { BUILT_WITH, type BadgeText } from "../src/badge-text.ts"
import { BADGE_ALT, BADGE_PNG_SCALE, BADGE_SIZE, type Badge } from "../src/badge-files.ts"
import { rasterizeSvg, type Size } from "./logo-render.ts"

/** The colors of one badge. `logo` is the full-color lockup, or the mono one in white. */
export interface BadgeStyle {
  plate: string
  border: string
  text: string
  logo: "gradient" | "white"
}

/** Light plate: the standard logo. Dark plate: posthog.com's dark background, the light logo. */
export const BADGE_STYLES: Record<Badge["background"], BadgeStyle> = {
  light: { plate: "#fdfdf8", border: "#d2d3cc", text: "#65675e", logo: "gradient" },
  dark: { plate: "#1d1f27", border: "#3a3c43", text: "#bfc1b7", logo: "white" },
}

const LOGO_X = 10
const LOGO_Y = 26
/** The landscape lockup is 160×28 units, so this draws it 80×14 px. */
const LOGO_SCALE = 0.5
const TEXT_BASELINE = 16.5
/** Half the 1 px border, so the stroke stays inside the canvas. */
const INSET = 0.5
/** At the border's center line: 6 px outside it, 5 px inside. */
const RADIUS = 5.5

/** Anything that would make a file depend on the page that shows it, or run code. */
const NOT_SELF_CONTAINED =
  /<(?:text|style|image|use|script|foreignObject)\b|currentColor|href=|@font-face/

const round = (n: number): number => Math.round(n * 100) / 100

/** Gives the logo's fixed ids a per-badge prefix, so two badges inlined on a page can't clash. */
function prefixIds(markup: string, prefix: string): string {
  return markup
    .replaceAll(/\bid="([^"]+)"/g, `id="${prefix}-$1"`)
    .replaceAll(/url\(#([^)]+)\)/g, `url(#${prefix}-$1)`)
}

/** A standalone badge SVG in any style (the published ones use {@link BADGE_STYLES}). */
export function composeBadge(id: string, style: BadgeStyle, text: BadgeText = BUILT_WITH): string {
  const { width, height } = BADGE_SIZE
  const logo =
    style.logo === "gradient"
      ? LOGO_BODY.landscape.gradient
      : LOGO_BODY.landscape.mono.replaceAll("currentColor", "#fff")
  const textX = round(width / 2 - (text.ink.x + text.ink.width / 2))
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<title>${BADGE_ALT}</title>` +
    `<rect x="${INSET}" y="${INSET}" width="${width - 2 * INSET}" height="${height - 2 * INSET}" rx="${RADIUS}" fill="${style.plate}" stroke="${style.border}"/>` +
    `<path fill="${style.text}" transform="translate(${textX} ${TEXT_BASELINE})" d="${text.d}"/>` +
    `<g transform="translate(${LOGO_X} ${LOGO_Y}) scale(${LOGO_SCALE})">${prefixIds(logo, id)}</g>` +
    `</svg>`
  const leak = NOT_SELF_CONTAINED.exec(svg)
  if (leak) throw new Error(`Badge "${id}" is not self-contained: found "${leak[0]}"`)
  return svg
}

export function badgeSvg(badge: Badge): string {
  return composeBadge(badge.id, BADGE_STYLES[badge.background])
}

/** Pixel size of every badge PNG. */
export const BADGE_PNG_SIZE: Size = {
  width: BADGE_SIZE.width * BADGE_PNG_SCALE,
  height: BADGE_SIZE.height * BADGE_PNG_SCALE,
}

export function badgePng(badge: Badge): Promise<Buffer> {
  return rasterizeSvg(badgeSvg(badge), BADGE_PNG_SIZE)
}
