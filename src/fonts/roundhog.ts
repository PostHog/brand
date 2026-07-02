// RoundHog — PostHog's brand typeface — bundled offline as woff2, one face per
// weight/style. The URLs resolve to files shipped beside this module
// (dist/fonts/*.woff2) via new URL(..., import.meta.url): the exact asset
// resolution the PNG modules use, so any ESM-aware bundler emits/rewrites them
// with no CDN and no loader config.

import type { FontFace, FontFamily } from "./types.ts"

/** CSS `font-family` name for RoundHog. */
export const ROUND_HOG_FAMILY: string = "RoundHog"

// Upright faces.
export const roundHogRegularUrl: string = new URL("./RoundHog.woff2", import.meta.url).href
export const roundHogMediumUrl: string = new URL("./RoundHog-Medium.woff2", import.meta.url).href
export const roundHogSemiBoldUrl: string = new URL("./RoundHog-SemiBold.woff2", import.meta.url)
  .href
export const roundHogBoldUrl: string = new URL("./RoundHog-Bold.woff2", import.meta.url).href

// Italic faces (shipped so the browser never synthesizes a slant).
export const roundHogItalicUrl: string = new URL("./RoundHog-Italic.woff2", import.meta.url).href
export const roundHogMediumItalicUrl: string = new URL(
  "./RoundHog-Medium-Italic.woff2",
  import.meta.url,
).href
export const roundHogSemiBoldItalicUrl: string = new URL(
  "./RoundHog-SemiBold-Italic.woff2",
  import.meta.url,
).href
export const roundHogBoldItalicUrl: string = new URL(
  "./RoundHog-Bold-Italic.woff2",
  import.meta.url,
).href

/**
 * Every RoundHog face. Weight mapping follows the PostHog app's type scale:
 * Regular→400, Medium→500, SemiBold→700, Bold→800. Regular (400) is shipped
 * explicitly so a body weight never falls back to Medium — CSS font fallback is
 * per-missing-glyph, not per-missing-weight.
 */
export const roundHogFaces: readonly FontFace[] = [
  { weight: 400, style: "normal", url: roundHogRegularUrl, format: "woff2" },
  { weight: 400, style: "italic", url: roundHogItalicUrl, format: "woff2" },
  { weight: 500, style: "normal", url: roundHogMediumUrl, format: "woff2" },
  { weight: 500, style: "italic", url: roundHogMediumItalicUrl, format: "woff2" },
  { weight: 700, style: "normal", url: roundHogSemiBoldUrl, format: "woff2" },
  { weight: 700, style: "italic", url: roundHogSemiBoldItalicUrl, format: "woff2" },
  { weight: 800, style: "normal", url: roundHogBoldUrl, format: "woff2" },
  { weight: 800, style: "italic", url: roundHogBoldItalicUrl, format: "woff2" },
]

/** RoundHog as a single {@link FontFamily}: its CSS name plus every face. */
export const roundHog: FontFamily = {
  family: ROUND_HOG_FAMILY,
  faces: roundHogFaces,
}
