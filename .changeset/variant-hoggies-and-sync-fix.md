---
"@posthog/brand": minor
---

feat: variant compound components for numbered hoggies + sync fixes

Numbered hedgehog families now ship as a single compound component that takes a `variant`
prop, instead of separate numbered exports. For example `HedgehogGladiator1` /
`HedgehogGladiator2` become one `<HedgehogGladiator variant="1" | "2" />` (the first
variant is the default, rendered with no prop). This covers `construction`, `gladiator`,
`lemon-wrangler`, `mr-potato-head`, and — once synced — `noir-hog`, `swimmer`, and
`wizard`. Each variant still has its own `svg` / `png` string+URL export and its own
`AssetMeta` (sharing the base slug, keyed by `variant`), so search and the raw asset
subpaths are unchanged. Grouping is declared explicitly in `scripts/lib/variants.ts`.

Also: the Figma sync now reads `INSTANCE` nodes (not only `COMPONENT` / `COMPONENT_SET`),
so hoggies that were republished as instances of a shared library component are picked up
again; and a new guard fails the sync loudly if it would remove a published component
export (a renamed or deleted hog), rather than shipping a silent breaking change.

> While the package is pre-1.0 (`0.x`), these API changes are released as minor bumps.
