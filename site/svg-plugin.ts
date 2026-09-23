// Lazy per-asset SVG loaders for the copy menu.
//
// The catalog grids render PNG thumbnails, so no SVG is bundled up front — but the tiles'
// right-click menu offers "Copy SVG", which needs the markup. Importing the `svg` barrel
// would inline every asset's full-detail body into the route chunk (hoggies alone is
// ~27 MiB, over Cloudflare Pages' per-file cap), and Vite can't glob a bare package
// subpath. So this plugin lists the package's built leaf SVG modules and emits one
// `() => import("@posthog/brand/<group>/svg/<slug>")` per asset: each becomes its own
// small chunk, fetched only when someone actually copies that SVG, and resolved through
// the real `./<group>/svg/*` export so it's exactly what consumers import.
//
//   import svg from "virtual:brand-svg/hoggies"      // { [moduleSlug]: () => Promise<string> }
//   import svg from "virtual:brand-svg/crests-full"
//   import svg from "virtual:brand-svg/crests-mini"
//
// Keyed by the leaf module's slug (the published slug; `<base>-<key>` for a variant member).
//
// The loaders rebuild the markup from the leaf's `viewBox` + `body` exports rather than
// reading its `svg` export: a few leaves (the Overview/404 art) are also imported
// statically by the components in the entry chunk, which only keep `viewBox`/`body` — the
// full `svg` string duplicates the body, and asking for it would drag ~1.4 MB of dead
// weight into the initial bundle. The rebuilt string is byte-identical to the `svg` export
// for every asset (the package's roots differ only in the `xlink` namespace).

import { readdirSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, join } from "node:path"
import type { Plugin } from "vite"

const require = createRequire(import.meta.url)

/** Virtual-module suffix → the group's export subpath (also its dir under `dist/generated`). */
const GROUPS: Record<string, string> = {
  hoggies: "hoggies",
  "crests-full": "crests/full",
  "crests-mini": "crests/mini",
}

const PREFIX = "virtual:brand-svg/"

function svgDir(group: string): string {
  const root = dirname(require.resolve("@posthog/brand/package.json"))
  return join(root, "dist", "generated", group, "svg")
}

/** Vite plugin serving the `virtual:brand-svg/<group>` lazy loader maps. */
export function brandSvg(): Plugin {
  return {
    name: "brand-svg",
    resolveId(id) {
      if (id.startsWith(PREFIX) && GROUPS[id.slice(PREFIX.length)]) return `\0${id}`
    },
    load(id) {
      if (!id.startsWith(`\0${PREFIX}`)) return undefined
      const group = GROUPS[id.slice(`\0${PREFIX}`.length)]
      if (!group) return undefined
      const slugs = readdirSync(svgDir(group))
        .filter((f) => f.endsWith(".mjs") && f !== "index.mjs")
        .map((f) => f.slice(0, -".mjs".length))
      // Destructuring in `.then` lets Rollup tree-shake the leaf's unused exports.
      const entries = slugs.map(
        (slug) =>
          `  ${JSON.stringify(slug)}: () => import(${JSON.stringify(`@posthog/brand/${group}/svg/${slug}`)}).then(({ viewBox, body }) => markup(viewBox, body)),`,
      )
      return [
        "const XLINK = ' xmlns:xlink=\"http://www.w3.org/1999/xlink\"';",
        "const markup = (viewBox, body) =>",
        '  `<svg xmlns="http://www.w3.org/2000/svg"${body.includes("xlink:") ? XLINK : ""} fill="none" viewBox="${viewBox}">${body}</svg>`;',
        `export default {\n${entries.join("\n")}\n};`,
      ].join("\n")
    },
  }
}
