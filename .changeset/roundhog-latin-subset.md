---
"@posthog/brand": minor
---

Cut each RoundHog face into subsets by script: `latin`, `latin-ext`, `greek`, `cyrillic` and `rest`. `roundHogFontFaceCss` now registers the subsets instead of the full faces. Their `unicode-range`s don't overlap, so a page loads only the subsets for the characters it shows: about 50 KB per face for Latin text, against about 120 KB before, and a Cyrillic or Greek name adds about 10–15 KB. Each face has a new optional `subsets` field with each subset's `name`, `url` and `unicodeRange`.
