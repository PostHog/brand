// @posthog/brand/fonts/css — RoundHog as a ready-to-inject `@font-face` string.
//
// The bundled woff2 URLs are already baked in (resolved via import.meta.url), so
// this drops straight into a <style> tag in any app — no CDN, no loader config:
//
//   import { roundHogFontFaceCss } from "@posthog/brand/fonts/css";
//   const style = document.createElement("style");
//   style.textContent = roundHogFontFaceCss;
//   document.head.appendChild(style);
//   // then: font-family: "RoundHog", sans-serif;

import type { FontFace, FontFamily } from "./types.ts"
import { roundHog } from "./roundhog.ts"

function fontFaceRule(
  font: FontFamily,
  face: FontFace,
  url: string,
  unicodeRange?: string,
): string {
  return [
    "@font-face {",
    `  font-family: "${font.family}";`,
    `  font-style: ${face.style};`,
    `  font-weight: ${face.weight};`,
    "  font-display: swap;",
    `  src: url("${url}") format("${face.format}");`,
    ...(unicodeRange ? [`  unicode-range: ${unicodeRange};`] : []),
    "}",
  ].join("\n")
}

/** Build the `@font-face` rules for one {@link FontFamily}. Exported for reuse. */
export function fontFaceCss(font: FontFamily): string {
  return font.faces
    .flatMap((face: FontFace) =>
      face.subsets
        ? face.subsets.map((s) => fontFaceRule(font, face, s.url, s.unicodeRange))
        : [fontFaceRule(font, face, face.url)],
    )
    .join("\n\n")
}

/** RoundHog's eight faces as `@font-face` rules, one per subset of each face. */
export const roundHogFontFaceCss: string = fontFaceCss(roundHog)
