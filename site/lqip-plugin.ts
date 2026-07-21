// Compile-time LQIP (low-quality image placeholder) generator.
//
// The catalog grids lazy-load full PNG thumbnails; this plugin gives each one a tiny
// blurred stand-in that's inlined into the JS (a base64 data URI) so it paints instantly
// while the real image streams in. It reads the *published* PNGs straight out of
// `@posthog/brand`'s `dist/` — the same files the browser ultimately fetches — downscales
// each to ~20px and re-encodes as WebP, so ~200 placeholders cost only a few tens of KB.
//
// It exposes one virtual module per export group so a route chunk carries only the
// placeholders it renders:
//   import lqip from "virtual:brand-lqip/hoggies"      // { [pngExportName]: dataURI }
//   import lqip from "virtual:brand-lqip/crests-full"
//   import lqip from "virtual:brand-lqip/crests-mini"
// keyed by the package's own PNG export names, so the site looks a placeholder up with the
// exact key it already computes for the URL (see src/assets-{hoggies,crests}.ts).

import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, join } from "node:path"
import type { Plugin } from "vite"
import sharp from "sharp"

const require = createRequire(import.meta.url)

/** Virtual-module suffix → the group's generated `png` dir, relative to `dist/generated`. */
const GROUP_DIRS: Record<string, string> = {
  hoggies: "hoggies/png",
  "crests-full": "crests/full/png",
  "crests-mini": "crests/mini/png",
}

const PREFIX = "virtual:brand-lqip/"

/** Absolute path to the built `@posthog/brand` package (resolves the workspace symlink). */
function distGeneratedDir(): string {
  return join(dirname(require.resolve("@posthog/brand/package.json")), "dist", "generated")
}

/**
 * Map every PNG export name in a group to a tiny blurred WebP data URI. Reuses the leaf
 * modules' own `new URL("./x.png")` reference to find each source file, so it's immune to
 * slug/filename quirks (e.g. the `996` module points at `9-9-6.png`).
 */
async function buildGroupMap(rel: string): Promise<Record<string, string>> {
  const dir = join(distGeneratedDir(), rel)
  const index = readFileSync(join(dir, "index.mjs"), "utf8")

  // local import name → leaf module basename (local names look like `src`, `src$1`, …)
  const localToFile = new Map<string, string>()
  for (const m of index.matchAll(/import\s+([\w$]+)\s+from\s+"\.\/([^"]+)\.mjs"/g)) {
    localToFile.set(m[1], m[2])
  }
  // the single `export { local as ExportName, … }` statement
  const exportBlock = /export\s*\{([^}]*)\}/.exec(index)?.[1] ?? ""

  const out: Record<string, string> = {}
  for (const m of exportBlock.matchAll(/([\w$]+)\s+as\s+([\w$]+)/g)) {
    const [, local, exportName] = m
    const file = localToFile.get(local)
    if (!file) continue
    const leaf = readFileSync(join(dir, `${file}.mjs`), "utf8")
    const png = /new URL\("\.\/([^"]+)"/.exec(leaf)?.[1]
    if (!png) continue

    const tiny = await sharp(readFileSync(join(dir, png)))
      .resize(20, 20, { fit: "inside" })
      .blur() // light pre-blur; the tile also applies a CSS blur
      .webp({ quality: 40, alphaQuality: 60 })
      .toBuffer()
    out[exportName] = `data:image/webp;base64,${tiny.toString("base64")}`
  }
  return out
}

/** Vite plugin serving the `virtual:brand-lqip/<group>` placeholder maps. */
export function brandLqip(): Plugin {
  const cache = new Map<string, Promise<Record<string, string>>>()

  return {
    name: "brand-lqip",
    resolveId(id) {
      if (id.startsWith(PREFIX) && GROUP_DIRS[id.slice(PREFIX.length)]) return `\0${id}`
    },
    async load(id) {
      if (!id.startsWith(`\0${PREFIX}`)) return undefined
      const group = id.slice(`\0${PREFIX}`.length)
      const rel = GROUP_DIRS[group]
      if (!rel) return undefined
      if (!cache.has(group)) cache.set(group, buildGroupMap(rel))
      const map = await cache.get(group)!
      return `export default ${JSON.stringify(map)};`
    },
  }
}
