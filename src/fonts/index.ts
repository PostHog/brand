// @posthog/brand/fonts — PostHog's brand typeface, RoundHog, bundled offline.
//
// Ships eight woff2 faces (Regular/Medium/SemiBold/Bold × upright/italic) plus the
// metadata to register them. No CDN, no runtime fetch: the URLs resolve to files
// emitted beside this module, exactly like the PNGs. React-free, image-only payload,
// so it is NOT re-exported from the root — import it from this subpath:
//
//   // 1. Drop-in CSS string (any app):
//   import { roundHogFontFaceCss } from "@posthog/brand/fonts/css";
//   document.head.insertAdjacentHTML("beforeend", `<style>${roundHogFontFaceCss}</style>`);
//
//   // 2. Build your own @font-face / preload from the metadata:
//   import { roundHog } from "@posthog/brand/fonts";
//   roundHog.faces.map((f) => f.url); // the bundled woff2 URLs
//
//   // 3. Grab a single face URL:
//   import { roundHogRegularUrl } from "@posthog/brand/fonts";

export type { FontFace, FontFamily, FontStyle } from "./types.ts"

export {
  roundHog,
  roundHogFaces,
  ROUND_HOG_FAMILY,
  roundHogRegularUrl,
  roundHogItalicUrl,
  roundHogMediumUrl,
  roundHogMediumItalicUrl,
  roundHogSemiBoldUrl,
  roundHogSemiBoldItalicUrl,
  roundHogBoldUrl,
  roundHogBoldItalicUrl,
} from "./roundhog.ts"

export { roundHogFontFaceCss, fontFaceCss } from "./css.ts"
