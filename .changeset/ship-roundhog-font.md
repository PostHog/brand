---
"@posthog/brand": minor
---

feat: ship the RoundHog brand font

Add PostHog's brand typeface, RoundHog, as bundled `woff2` faces under two new
subpaths — `@posthog/brand/fonts` (face metadata + per-face URLs) and
`@posthog/brand/fonts/css` (a ready-to-inject `@font-face` string). Eight faces
ship (Regular / Medium / SemiBold / Bold × upright + italic); the woff2 files are
emitted inside the package and their URLs are resolved via `import.meta.url`, so
there's no CDN and no loader config. Raw files are also reachable at
`@posthog/brand/fonts/*`.
