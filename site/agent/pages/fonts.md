# RoundHog, PostHog's typeface

> {{description}}

HTML version: {{site}}/fonts · All docs for agents: {{site}}/llms.txt

## In code

```ts
import { roundHogFontFaceCss } from "@posthog/brand/fonts/css"

const style = document.createElement("style")
style.textContent = roundHogFontFaceCss // @font-face rules with the bundled woff2 URLs
document.head.appendChild(style)
// then: font-family: "RoundHog", sans-serif;
```

Or `import { roundHog } from "@posthog/brand/fonts"` for the face metadata (family, weights, styles, URLs) to build your own `@font-face` or preload tags.

## Subsets

Each face is about 120 KB, and most of that is scripts a page rarely shows. So each face is also cut into five subsets by script, in `face.subsets`, each with a `name`, `url` and `unicodeRange`:

- `latin`: English and Western European letters, accents, punctuation, €, and the arrow, math, keyboard (⌘ ⌥), box drawing and dingbat symbols the PostHog UI uses. Almost every page needs only this.
- `latin-ext`: Central and Eastern European Latin, Vietnamese, phonetic letters, other currency signs.
- `greek`, `cyrillic`.
- `rest`: superscripts, fractions, letterlike symbols, private-use glyphs.

The ranges don't overlap, so the browser downloads a subset only when the page shows one of its characters. Latin text loads about 50 KB per face, and a Cyrillic or Greek name adds 10–15 KB. `roundHogFontFaceCss` registers the subsets. If you write your own rules, register one `@font-face` per subset with its `unicode-range`, and leave the full face out: its range covers everything, so a page with any non-Latin character would load it as well. To preload, preload the `latin` subset, not the full face. The full faces are for downloads and design tools.

## Files

There's a stylesheet at {{site}}/fonts/roundhog.css. It uses relative URLs and has CORS enabled, so you can link it from anywhere.

{{faces}}

Weights follow the PostHog app's type scale: Regular 400, Medium 500, SemiBold 700, Bold 800.

{{license}}
