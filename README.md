# @posthog/hedgehogs

PostHog's hedgehog illustrations, as an npm package. React components, raw SVGs, and
searchable metadata — all bundled into the package, so there are **zero runtime CDN calls**.

```bash
pnpm add @posthog/hedgehogs
```

```tsx
import { HedgehogDoctorNurse } from "@posthog/hedgehogs";

export function Example() {
  return <HedgehogDoctorNurse size={120} title="A hedgehog doctor" />;
}
```

Every component is named `Hedgehog<Name>` (so your editor autocompletes the whole set
when you type `Hedgehog`), carries its metadata as a static `.meta`, and is fully
tree-shakeable — importing one hedgehog bundles only that one.

## Entry points

| Import                        | What you get                                                             |
| ----------------------------- | ------------------------------------------------------------------------ |
| `@posthog/hedgehogs`          | Smart React component per hedgehog (inline SVG when available, else PNG) |
| `@posthog/hedgehogs/svg`      | Raw SVG strings + lazy loader (only assets shipped as SVG)               |
| `@posthog/hedgehogs/png`      | Bundled PNG URLs + lazy loader (every asset)                             |
| `@posthog/hedgehogs/metadata` | Tiny manifest + search helpers, no image payload — build pickers here    |

## Props

Components accept all native `<svg>` / `<img>` props, plus:

- `size` — sets the width (number = px, or any CSS length); height follows the
  illustration's aspect ratio.
- `title` — an accessible label. When set the image is announced (SVG `<title>` /
  `<img alt>`); when omitted it's treated as decorative (`aria-hidden`).

```tsx
import { HedgehogWizard } from "@posthog/hedgehogs";

<HedgehogWizard size={200} title="A wizard hedgehog" className="float-right" />;
```

## Raw SVGs and PNGs

```ts
import doctorNurse from "@posthog/hedgehogs/svg/doctor-nurse"; // SVG string
import wizardPng from "@posthog/hedgehogs/png/wizard"; // bundled PNG URL
```

Both subpaths also expose named exports (`hedgehogDoctorNurseSvg`, `hedgehogWizardPng`)
and lazy loaders (`loadHedgehogSvg(slug)`, `loadHedgehogPng(slug)`) for building pickers
without bundling every asset.

## Metadata and search

```ts
import { findHedgehogs, getHedgehog, hedgehogs, tagVocabulary } from "@posthog/hedgehogs/metadata";

findHedgehogs({ tags: ["wizard"], version: "v3" });
findHedgehogs({ text: "coffee", delivery: "svg" });
getHedgehog("doctor-nurse"); // full HedgehogMeta
```

`getRasterUrl(slug, "lg" | "original")` returns higher-resolution CDN URLs when you need
more than the bundled 768px PNG — note that those _do_ hit the network.

## SVG vs PNG delivery

Most illustrations are auto-traced vectors that are multiple megabytes each, so bundling
every SVG isn't viable. Each asset therefore ships in the best form that fits the budget:

- `delivery: "svg"` — a true vector, optimized and inlined (crisp, scalable).
- `delivery: "png"` — a 768px PNG rendered from the same source (the trace came _from_ that raster, so fidelity matches).

Either way the API is identical and everything is bundled — no runtime CDN calls. Filter
by `delivery` in `findHedgehogs`, or read `Component.meta.delivery`. We're steadily
migrating assets toward `"svg"`.

> All assets are included regardless of `usageType`. For external surfaces, filter
> `findHedgehogs({ usageType: "public" })`.

## How art gets here

Illustrations live in PostHog's art pipeline and are published to a public catalog.
A daily GitHub Action syncs that catalog into this repo (`assets/`) and commits the
changes — plus a [changeset](https://github.com/changesets/changesets) — straight to
`main` (no PR). That triggers the release workflow, which bumps the version, commits it
back to `main`, and publishes to npm with trusted publishing (OIDC) — gated behind Slack
approval, per the
[PostHog SDK release process](https://posthog.com/handbook/engineering/sdks/releases).

Every asset ships as an optimized SVG when it's a true vector under budget, otherwise as a
768px PNG rendered from the same source. We're migrating everything toward true SVGs, and a
weekly workflow reports progress.

## License

Source-available under the [PolyForm Strict License 1.0.0](./LICENSE) — you may view
the source, but commercial use, use in your own projects, redistribution, and derivative
works are not licensed. The hedgehog illustrations are PostHog trademarks and brand assets.
For licensing inquiries, contact hey@posthog.com.
