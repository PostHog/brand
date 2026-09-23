import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { brandLqip } from "./lqip-plugin.ts"
import { brandSeo } from "./seo-plugin.ts"
import { brandSvg } from "./svg-plugin.ts"

// Plain static SPA. Consumes @posthog/brand through its real `exports` map (the
// workspace symlink resolves to the package's built `dist/`), so the site renders
// exactly what npm consumers get. Build output lands in `site/dist`, which is what
// Cloudflare Pages serves.
//
// The catalog grids render PNG thumbnails (see site/src/assets-{hoggies,crests}.ts), so
// the heavy inline-SVG barrels are no longer bundled and each PNG is emitted as its own
// file the browser lazy-loads — nothing approaches Cloudflare Pages' 25 MiB per-file cap.
// `brandLqip` inlines a tiny blurred placeholder per thumbnail so tiles paint instantly, and
// `brandSvg` gives each asset's SVG its own lazy chunk for the tiles' "Copy SVG" menu.
//
// `brandSeo` owns everything a crawler sees: it injects the head metadata into index.html and,
// after the bundle is written, prerenders one static HTML file per route (plus sitemap.xml and
// the Cloudflare `_redirects` that route each path to its own file). See seo-plugin.ts.
export default defineConfig({
  plugins: [react(), brandLqip(), brandSvg(), brandSeo()],
  base: "/",
  // `@posthog/brand` is a workspace symlink, so a bare `react` import inside its `dist/`
  // resolves from the *repo root's* node_modules, not the site's — and the root installs
  // its own React (a devDependency, for the package's tests). Without deduping, the two
  // resolutions land in the bundle as two React instances: react-dom renders with one while
  // the package's hooks read the other's (null) dispatcher, so anything from `@posthog/brand`
  // that calls a hook — `<Logo.Logomark>` — throws
  // "Cannot read properties of null (reading 'useRef')" and blanks the route.
  // `dedupe` forces every `react`/`react-dom` import in the graph to the site's single copy.
  resolve: { dedupe: ["react", "react-dom"] },
  build: { outDir: "dist" },
})
