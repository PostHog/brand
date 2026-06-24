# Contributing

Thanks for the interest — but **`@posthog/brand` does not accept external contributions.**

This package is maintained by the PostHog team. It is not a hand-authored library: it is a
**mirror of PostHog's brand-book Figma file**. A daily GitHub Action renders every component
to SVG + PNG via the Figma API, regenerates the bundled output, and commits the result —
together with a changeset — straight to `main`, which publishes a new version to npm. Almost
everything you'd want to change (which illustrations exist, what they look like, their names)
is decided in Figma, not in this repo, so a pull request against the source here would be
overwritten by the next sync.

## What this means for you

- **Pull requests will not be merged.** There is no PR-based workflow — releases are committed
  directly to `main` by automation.
- **Bug reports are welcome.** If an asset is broken, mislabeled, or missing, or the package
  itself misbehaves (build, types, exports), please
  [open an issue](https://github.com/PostHog/hedgehogs/issues).
- **Brand/design changes happen in Figma.** New or updated illustrations and crests come from
  the brand-book Figma file and flow in through the daily sync — not through this repo. (The
  `<Logo>` component and the color palette are the exceptions: both are hand-maintained.)
- **Licensing.** The brand assets are PostHog trademarks, source-available under the
  [PolyForm Strict License 1.0.0](./LICENSE). They are not free to reuse, redistribute, or
  build on. For licensing inquiries, contact **hey@posthog.com**.

If you're on the PostHog team and need to change how the sync, codegen, or release works, see
[CLAUDE.md](./CLAUDE.md) for the data flow and conventions.
