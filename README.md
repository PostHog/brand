# @posthog/brand

PostHog's brand assets, as an npm package: hedgehog illustrations, logos, crests, and
brand colors — React components, raw SVGs, PNG URLs, and color tokens, all bundled into the
package, so there are **zero runtime CDN calls**.

```bash
pnpm add @posthog/brand
```

## Quick start

The primary surface is **React components** — one per asset, imported from a namespace
subpath. Each is an inline-SVG component, so it scales crisply and tree-shakes down to only
what you import.

```tsx
import { HedgehogDoctorHog } from "@posthog/brand/hoggies"
import { Logo } from "@posthog/brand/logo"
import { ArrayCrest } from "@posthog/brand/crests"

export function Example() {
  return (
    <>
      <HedgehogDoctorHog size={120} title="A hedgehog doctor" />
      <Logo size={200} title="PostHog" />
      <ArrayCrest size={64} /> {/* full crest */}
      <ArrayCrest.Mini size={24} /> {/* simplified mini badge */}
    </>
  )
}
```

Naming follows the namespace: hoggies are `Hedgehog<Name>`. Crests are a compound component
`<Name>Crest` whose base is the full illustration and whose `.Mini` is the simplified badge.

The logo is a single generic `<Logo>` component (see [Logo](#logo) below).

### Props

Components accept all native `<svg>` props, plus:

- **`size`** — sets the width (number = px, or any CSS length); height follows the
  illustration's aspect ratio.
- **`title`** — an accessible label. When set, the image is announced (via an SVG
  `<title>`); when omitted, it's treated as decorative (`aria-hidden`).

Each illustration component also carries its metadata as a static `.meta`
(`HedgehogDoctorHog.meta.slug`, `.aspectRatio`, …).

## Logo

The logo isn't a per-asset namespace — it's one generic, parametric component that covers
every lockup and color treatment, so it can be the single PostHog logo you use everywhere.

```tsx
import { Logo } from "@posthog/brand/logo"
;<Logo /> // landscape lockup, full gradient (the defaults)
;<Logo variant="mono" color="#fff" /> // single color
;<Logo variant="mono" /> // inherits the ambient CSS `color`
;<Logo variant="print" layout="stacked" /> // 4-color / CMYK, portrait lockup
;<Logo.Logomark /> // the hedgehog icon only
;<Logo.Wordmark /> // the "PostHog" wordmark only
```

| Prop      | Values                                                    | Default        |
| --------- | --------------------------------------------------------- | -------------- |
| `variant` | `"gradient"` · `"print"` (4-color/CMYK) · `"mono"`        | `"gradient"`   |
| `layout`  | `"landscape"` · `"stacked"` · `"logomark"` · `"wordmark"` | `"landscape"`  |
| `color`   | any CSS color — used by `mono` only                       | `currentColor` |

`Logo.Logomark` and `Logo.Wordmark` are shorthands for `layout="logomark"` / `"wordmark"`.
A `mono` logo (and the always-mono wordmark) draws with `currentColor`, so it inherits the
surrounding text color unless you pass an explicit `color`. Every form also accepts `size`,
`title`, `className`, `style`, and the rest of the native `<svg>` props.

## Namespaces

Assets are grouped into namespaces, each its own set of subpath exports. The component import
is the one you'll reach for most; every namespace also exposes raw SVG strings, PNG URLs, and
metadata (see the collapsed sections below).

| Namespace | Component import         | Naming                  |
| --------- | ------------------------ | ----------------------- |
| `hoggies` | `@posthog/brand/hoggies` | `Hedgehog<Name>`        |
| `crests`  | `@posthog/brand/crests`  | `<Name>Crest` + `.Mini` |

(The logo lives at `@posthog/brand/logo` but is a single `<Logo>` component, not a per-asset
namespace — see [Logo](#logo).)

Crests come in two size tiers — the full illustration and the simplified `mini` badge. The
combined `@posthog/brand/crests` barrel pairs them as `<Name>Crest` + `.Mini`. If you want a
single tier on its own, the tier-specific subpaths expose each one individually:
`ArrayCrest` from `@posthog/brand/crests/full`, `ArrayCrestMini` from
`@posthog/brand/crests/mini`.

The root `@posthog/brand` is **metadata-only** (types + the cross-namespace manifest +
search) — it pulls in no React and no image payload.

## Raw SVGs and PNGs

Sometimes you don't want a React component — you need the raw SVG markup (to inline into an
email or a non-React app) or a bundled PNG URL (for an `<img>` tag). Every asset ships as
**both** an optimized inline SVG (minified with SVGO) and an optimized PNG (palette-quantized
with pngquant, then losslessly recompressed with oxipng — still a standard PNG, so it renders
anywhere).

```ts
import doctorHogSvg from "@posthog/brand/hoggies/svg/doctor-hog" // SVG string
import doctorHogPng from "@posthog/brand/hoggies/png/doctor-hog" // bundled PNG URL
```

<details>
<summary><strong>All <code>/svg</code> and <code>/png</code> subpaths</strong></summary>

Each namespace exposes the same four shapes. Replace `<g>` with one of `hoggies`,
`crests/full`, or `crests/mini` (the combined `crests` barrel is React-only — use the tier
subpaths for raw SVG/PNG; the logo ships only the `<Logo>` component):

| Subpath                         | Returns                                              |
| ------------------------------- | ---------------------------------------------------- |
| `@posthog/brand/<g>`            | React components                                     |
| `@posthog/brand/<g>/svg`        | barrel of named SVG strings (`hedgehogDoctorHogSvg`) |
| `@posthog/brand/<g>/svg/<slug>` | a single SVG string as the default export            |
| `@posthog/brand/<g>/png`        | barrel of named PNG URLs (`hedgehogDoctorHogPng`)    |
| `@posthog/brand/<g>/png/<slug>` | a single PNG URL as the default export               |
| `@posthog/brand/<g>/metadata`   | the group's `AssetMeta[]` manifest (React-free)      |

```ts
// Default import of the deep path — one asset, one module:
import doctorHogSvg from "@posthog/brand/hoggies/svg/doctor-hog"
import arrayCrestPng from "@posthog/brand/crests/full/png/array"

// Or the named barrel export, if you'd rather pull several from one import:
import {
  hedgehogDoctorHogSvg,
  hedgehogCakeHogSvg,
} from "@posthog/brand/hoggies/svg"

// Lazy-load by slug without bundling the whole namespace:
const svg = (await import("@posthog/brand/hoggies/svg/" + slug)).default
```

Crest minis keep a trailing `Mini` in their identifiers: `arrayCrestMiniSvg`,
`arrayCrestMiniPng`.

</details>

## Colors

```ts
import { colors } from "@posthog/brand/colors"

colors.blue.core // "#1490E8"
colors["corn-blue"].gradient // ["#2BB3DF", "#1A89AD"]
```

Each color has `core`, `lighter`, `darker`, and a `gradient` pair.

<details>
<summary><strong>Ready-made CSS custom properties</strong></summary>

For stylesheets, import the generated CSS custom properties instead of the JS object:

```ts
import { colorsCss } from "@posthog/brand/colors/css"
// :root { --posthog-blue: #1490E8; --posthog-blue-lighter: …; --posthog-blue-gradient: …; }
```

</details>

## Metadata and search

The root export is React-free and carries the full cross-namespace manifest plus helpers for
building a picker or looking an asset up by slug:

```ts
import {
  allAssets,
  findAssets,
  getAsset,
  getComponentName,
} from "@posthog/brand"

findAssets({ namespace: "crests", tier: "mini", text: "array" })
findAssets({ namespace: "hoggies", text: "doctor" })
getAsset("hoggies", "doctor-hog") // full AssetMeta
getAsset("crests", "array", "mini") // disambiguate the shared crest slug by tier
getComponentName("hoggies", "doctor-hog") // "HedgehogDoctorHog"
getComponentName("crests", "array", "mini") // "ArrayCrestMini"
```

Per-namespace manifests are also available without the cross-namespace pull — e.g.
`@posthog/brand/hoggies/metadata`.

## How assets get here

Brand assets live in PostHog's [brand-book Figma file](https://www.figma.com/design/EqKxlSFoOCkRXCnHi4C3eE).
A daily GitHub Action renders every component to SVG + PNG via the Figma API, syncs the
result into this repo (`assets/`), and commits the changes — plus a
[changeset](https://github.com/changesets/changesets) — straight to `main` (no PR). That
triggers the release workflow, which bumps the version, commits it back to `main`, and
publishes to npm with trusted publishing (OIDC) — gated behind Slack approval, per the
[PostHog SDK release process](https://posthog.com/handbook/engineering/sdks/releases).

The color palette is not synced — it's a fixed, hand-maintained list in
[`static/colors.ts`](./static/colors.ts). Edit it there (with a changeset) to change the
published tokens. The `<Logo>` component is likewise hand-maintained: its geometry is inlined
in [`src/logo/`](./src/logo) (not Figma-synced), since the logo is small and rarely changes.

The sync is incremental and batched: it re-renders only assets whose Figma node changed, so a
typical run stays well under Figma's per-minute API limit (it requires a Dev/Full-seat token).

Both formats are optimized before they're committed, so every asset stays small without
losing browser compatibility:

- **SVG** is minified with [SVGO](https://github.com/svg/svgo) (`scripts/lib/svg.ts`) — its
  browser-safe `preset-default`, with each asset's ids namespaced so inlined SVGs never
  collide on the same page.
- **PNG** is shrunk by [pngquant](https://pngquant.org/) (palette quantization) and then
  losslessly recompressed with [oxipng](https://github.com/oxipng/oxipng)
  (`scripts/lib/png.ts`). The output is still a standard PNG — it renders in any browser —
  just ~70% smaller. The pass never grows a file, so it's safe to re-run.

## Contributing

This package is maintained by the PostHog team and **mirrors a Figma file** — we don't accept
external contributions. See [CONTRIBUTING.md](./CONTRIBUTING.md) for the details.

## License

Source-available under the [PolyForm Strict License 1.0.0](./LICENSE) — you may view
the source, but commercial use, use in your own projects, redistribution, and derivative
works are not licensed. PostHog's illustrations, logos, and crests are PostHog trademarks and
brand assets. For licensing inquiries, contact hey@posthog.com.
