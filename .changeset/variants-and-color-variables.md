---
"@posthog/brand": minor
---

Add `getVariants(namespace, slug, tier?)` to the root export — every member of an asset's numbered variant family, in variant order (a standalone asset is a family of one) — and `colorCssVariable(slug, tone?)` to `@posthog/brand/colors`, which names the CSS custom properties `colorsCss` defines (`colorCssVariable("blue", "lighter")` → `"--posthog-blue-lighter"`).
