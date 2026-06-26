---
"@posthog/brand": minor
---

Add searchable tags to assets. Each illustration's Figma component description (a
comma-separated list, optionally behind a `Tags:` label) is now parsed during `sync` and
carried on `AssetMeta.tags`. `findAssets` folds tags into its free-text search and gains a
`tags` filter (match assets carrying all of the given tags, case-insensitive). Tag-only
description edits are picked up on the next sync even when the rendered image is unchanged.
