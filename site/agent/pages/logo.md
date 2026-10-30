# The PostHog logo

> {{description}}

HTML version: {{site}}/logo · All docs for agents: {{site}}/llms.txt

## Which logo to use

{{presets}}

## Guidelines

Do:

{{dos}}

Don't:

{{donts}}

## In code

The logo ships as one React component, `import { Logo } from "@posthog/brand/logo"`, configured with props. The package has no separate SVG or PNG exports for it, so outside React, use the files below.

```tsx
import { Logo } from "@posthog/brand/logo"

<Logo />                                // landscape lockup, full-color gradient
<Logo layout="stacked" />               // logomark above the wordmark
<Logo variant="print" />                // flat 4-color, for print
<Logo variant="mono" color="#fff" />    // single color (on dark backgrounds)
<Logo.Logomark size={32} />             // the hedgehog icon only
<Logo.Wordmark color="#000" />          // the "PostHog" wordmark only (always single-color)
<Logo.Logomark jumpOnClick />           // the logomark jumps when clicked
```

Props: `layout` (`landscape` default, `stacked`, `logomark`, `wordmark`), `variant` (`gradient` default, `print`, `mono`), `color` (any CSS color, for `mono` and the wordmark; inherits `currentColor` when omitted), `size` (width in px, height follows), `title` (accessible label), plus every native `<svg>` prop.

## Every logo file ({{logoCount}})

Each lockup in full color (`gradient`), 4-color print, black and white; the wordmark in black and white; and the logomark padded onto square and circle avatar canvases (for uploads that crop to a square or a circle). "For" is the background it is made for.

{{files}}

{{license}}
