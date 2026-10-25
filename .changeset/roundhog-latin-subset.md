---
"@posthog/brand": minor
---

Ship a Latin subset of each RoundHog face. `roundHogFontFaceCss` registers it with a `unicode-range`, so Latin text loads a file less than half the size. Other text still loads the full face. Each face has a new optional `latin` field with the subset URL and its range.
