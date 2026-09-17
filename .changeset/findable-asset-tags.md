---
"@posthog/brand": minor
---

`findAssets` free-text search now matches every word of the query separately, across the
asset's name, slug, generated component name, and tags. A written-out request such as
"hedgehog in a car" or "hog car" now finds the car-tagged hogs, where before only the
single word "car" did — the whole query had to be one substring of one field. Common filler
words (a, the, in, of, …) are ignored.
