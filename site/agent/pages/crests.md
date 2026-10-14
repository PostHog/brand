# PostHog team crests

> {{description}}

HTML version: {{site}}/crests · All docs for agents: {{site}}/llms.txt

Each crest comes in two tiers: the full illustration and a simplified mini badge for small sizes.

## In code

```tsx
import { MarketingCrest } from "@posthog/brand/crests"
<MarketingCrest size={64} />        // full illustration
<MarketingCrest.Mini size={24} />   // mini badge

import marketingCrestSvg from "@posthog/brand/crests/full/svg/marketing"
import marketingCrestMiniPng from "@posthog/brand/crests/mini/png/marketing"
```

## Files

{{site}}/crests/{slug}.svg and .png for the full crest; {slug}-mini for the badge.

## All {{crestCount}} crests

{{crests}}

{{license}}
