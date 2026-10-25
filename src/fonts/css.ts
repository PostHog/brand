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
  return (
    font.faces
      // Browsers try the last matching rule first, so the Latin rule follows the full
      // rule: Latin text loads only the small subset file.
      .flatMap((face: FontFace) => [
        fontFaceRule(font, face, face.url),
        ...(face.latin ? [fontFaceRule(font, face, face.latin.url, face.latin.unicodeRange)] : []),
      ])
      .join("\n\n")
  )
}

/** RoundHog's eight faces as a single `@font-face` CSS string. */
export const roundHogFontFaceCss: string = fontFaceCss(roundHog)
