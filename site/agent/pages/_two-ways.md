## Two ways to get any asset

**1. In a JavaScript or TypeScript project, use the npm package.** It's the easiest route. `@posthog/brand` bundles every asset on this site as typed, tree-shakeable imports: React components, raw SVG strings and PNG URLs. It works offline without a CDN or an API key, and it won't break the way a hotlinked file can.

```sh
{{install}}   # or: pnpm add / yarn add / bun add @posthog/brand
```

```tsx
import { Logo } from "@posthog/brand/logo"
import { HedgehogChart } from "@posthog/brand/hoggies"            // React component
import hedgehogChartSvg from "@posthog/brand/hoggies/svg/chart"   // SVG markup string, no React
import hedgehogChartPng from "@posthog/brand/hoggies/png/chart"   // PNG URL, resolved by your bundler
import { MarketingCrest } from "@posthog/brand/crests"
import { colors } from "@posthog/brand/colors"
import { findAssets } from "@posthog/brand"                       // search the catalog in code

<Logo />
<HedgehogChart size={96} />
<MarketingCrest size={64} />   <MarketingCrest.Mini size={24} />
```

**2. Anywhere else (slides, docs, a design tool, another language), download the file.** Every asset is a static file at a stable URL with CORS enabled, and you don't need auth or an API key to fetch it. Prefer the SVG, since it scales without losing quality. Use the PNG where SVG isn't accepted.

| Asset                            | SVG                                   | PNG                                               |
| -------------------------------- | ------------------------------------- | ------------------------------------------------- |
| Hoggie                           | {{site}}/hoggies/{slug}.svg           | {{site}}/hoggies/{slug}.png (about 1000 px)       |
| Hoggie variant (numbered family) | {{site}}/hoggies/{slug}-{variant}.svg | {{site}}/hoggies/{slug}-{variant}.png             |
| Crest                            | {{site}}/crests/{slug}.svg            | {{site}}/crests/{slug}.png (600 px)               |
| Crest mini badge                 | {{site}}/crests/{slug}-mini.svg       | {{site}}/crests/{slug}-mini.png                   |
| Logo                             | {{site}}/logo/{id}.svg                | {{site}}/logo/{id}.png (1600 px on the long side) |

```sh
curl -O {{site}}/hoggies/chart.svg
curl -O {{site}}/logo/posthog-logo.png
```

Slugs, ids and exact PNG sizes are in the lists below and in the machine-readable catalog, {{site}}/catalog.json.
