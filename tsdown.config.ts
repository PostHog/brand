import { defineConfig } from "tsdown"

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/colors.ts",
    "src/colors-css.ts",
    // The logo is hand-written (not Figma-synced / codegen'd); its geometry is inlined.
    "src/logo/**/*.ts",
    "src/logo/**/*.tsx",
    // Fonts are hand-maintained too: RoundHog woff2 faces + the metadata to register them.
    "src/fonts/**/*.ts",
    // Per-asset + per-namespace modules are emitted individually so deep imports
    // (@posthog/brand/<ns>/svg/<slug>, /<ns>/png/<slug>) and tree-shaking work.
    "src/generated/**/*.ts",
    "src/generated/**/*.tsx",
  ],
  format: "esm",
  // Preserve the module graph (no mega-bundle) — required for per-asset
  // tree-shaking, code-split deep imports, and per-PNG asset emission.
  unbundle: true,
  dts: true,
  clean: true,
  sourcemap: false,
  // React is an optional peer; never bundle it.
  external: ["react", "react/jsx-runtime", "react-dom"],
  // Ship each namespace's PNGs next to its generated png modules so their
  // `new URL("./<slug>.png", import.meta.url)` references resolve.
  // `to` is the parent: tsdown copies the `png` directory into it, yielding
  // dist/generated/<ns>/png/<slug>.png — beside each generated png module.
  copy: [
    { from: "assets/hoggies/png", to: "dist/generated/hoggies" },
    // Crests split per tier: each tier's PNGs sit beside its generated png modules.
    { from: "assets/crests/full/png", to: "dist/generated/crests/full" },
    { from: "assets/crests/mini/png", to: "dist/generated/crests/mini" },
    // RoundHog woff2 faces sit beside the font modules (dist/fonts/) so their
    // `new URL("./RoundHog*.woff2", import.meta.url)` references resolve. `copy`
    // nests the `from` dir under `to` by its basename, so from=assets/fonts +
    // to=dist yields dist/fonts/*.woff2 next to dist/fonts/*.mjs.
    { from: "assets/fonts", to: "dist" },
  ],
})
