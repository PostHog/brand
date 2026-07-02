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

/** Build the `@font-face` rules for one {@link FontFamily}. Exported for reuse. */
export function fontFaceCss(font: FontFamily): string {
  return font.faces
    .map((face: FontFace) =>
      [
        "@font-face {",
        `  font-family: "${font.family}";`,
        `  font-style: ${face.style};`,
        `  font-weight: ${face.weight};`,
        "  font-display: swap;",
        `  src: url("${face.url}") format("${face.format}");`,
        "}",
      ].join("\n"),
    )
    .join("\n\n")
}

/** RoundHog's eight faces as a single `@font-face` CSS string. */
export const roundHogFontFaceCss: string = fontFaceCss(roundHog)
