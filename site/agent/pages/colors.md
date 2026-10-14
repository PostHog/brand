# The PostHog color palette

> {{description}}

HTML version: {{site}}/colors · All docs for agents: {{site}}/llms.txt

{{colors}}

Each color also has `-lighter`, `-darker` and `-gradient` variables, e.g. `--posthog-blue-lighter`.

## In code

```ts
import { colors } from "@posthog/brand/colors"
colors.blue.core // "{{blue}}"

import { colorsCss } from "@posthog/brand/colors/css" // a :root { --posthog-… } block
```

## Files

- {{site}}/colors.json: the palette as JSON
- {{site}}/colors.css: the CSS custom properties
