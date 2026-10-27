---
"@posthog/brand": minor
---

Cut each RoundHog face into subsets by script: `latin`, `latin-ext`, `greek`, `cyrillic` and `rest`. Their `unicode-range`s don't overlap, so a page loads only the subsets for the characters it shows: about 50 KB per face for Latin text, against about 120 KB before, and a Cyrillic or Greek name adds about 10–15 KB. Each face has a new optional `subsets` field with each subset's `name`, `url` and `unicodeRange`.

**Breaking:** `roundHogFontFaceCss` now registers the subsets instead of the full faces, so nothing loads `face.url` anymore. If you preload `face.url`, preload the face's `latin` subset instead, or the browser downloads the full face and never uses it. If you write your own `@font-face` rules, register `face.subsets` and leave the full face out. The full faces still ship, for downloads and design tools.
