---
"@posthog/brand": patch
---

The Cursor hoggie now has a transparent background.

The `hog / cursor` component in the Figma brand book carried a white fill on its frame, so `<HedgehogCursor>`, `hedgehogCursorSvg`, and `hedgehogCursorPng` all rendered a solid white 1000×1000 plate behind the illustration — the only asset in the package without transparency. The fill has been removed at the source and the asset re-synced; both the SVG and PNG are now transparent like every other hoggie.
