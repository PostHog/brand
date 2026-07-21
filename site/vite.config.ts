import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { brandLqip } from "./lqip-plugin.ts"

// Plain static SPA. Consumes @posthog/brand through its real `exports` map (the
// workspace symlink resolves to the package's built `dist/`), so the site renders
// exactly what npm consumers get. Build output lands in `site/dist`, which is what
// Cloudflare Pages serves.
//
// The catalog grids render PNG thumbnails (see site/src/assets-{hoggies,crests}.ts), so
// the heavy inline-SVG barrels are no longer bundled and each PNG is emitted as its own
// file the browser lazy-loads — nothing approaches Cloudflare Pages' 25 MiB per-file cap.
// `brandLqip` inlines a tiny blurred placeholder per thumbnail so tiles paint instantly.
export default defineConfig({
  plugins: [react(), brandLqip()],
  base: "/",
  build: { outDir: "dist" },
})
