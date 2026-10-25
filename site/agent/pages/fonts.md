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

Or `import { roundHog } from "@posthog/brand/fonts"` for the face metadata (family, weights, styles, URLs) to build your own `@font-face` or preload tags. Each face has a `latin` subset (`face.latin.url`, `face.latin.unicodeRange`) less than half the full size. Register it after the full face, and preload the subset, not the full face.

## Files

There's a stylesheet at {{site}}/fonts/roundhog.css. It uses relative URLs and has CORS enabled, so you can link it from anywhere.

{{faces}}

Weights follow the PostHog app's type scale: Regular 400, Medium 500, SemiBold 700, Bold 800.

{{license}}
