---
"@posthog/brand": minor
---

Make tag parsing tolerant of inconsistent Figma description separators. Tag lists are now
split on slashes and periods in addition to commas and newlines, so descriptions like
`hog/ solo` or `meme. black clothes` become separate tags instead of one. Splitting is
intentionally greedy (a stray `Dr. Manhattan` yields `Dr`/`Manhattan`) since over-splitting
only adds harmless extra tags, while under-splitting hides assets from search; hyphens and
spaces are left intact (`hi-vis`, `lab coat`).
