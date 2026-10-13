# Hoggies — PostHog's hedgehogs

> {{description}}

HTML version: {{site}}/hoggies · All docs for agents: {{site}}/llms.txt

## In code

```tsx
import { HedgehogChart } from "@posthog/brand/hoggies"
<HedgehogChart size={96} title="A hedgehog with a chart" />

// Numbered families are one component with a `variant` prop:
<HedgehogConstruction variant="2" />

import hedgehogChartSvg from "@posthog/brand/hoggies/svg/chart"   // SVG string
import hedgehogChartPng from "@posthog/brand/hoggies/png/chart"   // PNG URL
import { findAssets } from "@posthog/brand"
findAssets({ namespace: "hoggies", text: "coffee" })        // search by name/slug/tag
```

## Files

{{site}}/hoggies/{slug}.svg and .png; a variant family member is {slug}-{variant}. Each hoggie also has its own page with the details (the "page" links are its markdown).

## All {{hoggieCount}} hoggies

{{hoggies}}

{{license}}
