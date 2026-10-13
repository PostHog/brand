// Build-time plugin for everything the site publishes for agents (the HTML side of SEO/AEO is
// seo-plugin.ts). After the bundle is written it emits, from the catalog in agent/data.ts:
//
//   • every asset as a static file at a stable URL — /hoggies/<slug>.svg|png,
//     /crests/<slug>[-mini].svg|png, /logo/<id>.svg|png, /fonts/*.woff2, /colors.json|css —
//     so an agent (or a person) can fetch one directly, no package, no auth;
//   • the markdown twin of every page (/logo.md, /hoggies/chart.md, …), /llms.txt,
//     /llms-full.txt and /catalog.json;
//   • `_headers`: the markdown content type, and CORS on all of the above.
//
// The dev server serves the same files from memory, so links to them work under `pnpm dev`.
//
// These paths are unhashed and stable on purpose: they're documented to agents and get pasted
// into prompts, docs and slides. Vite's own hashed copies under /assets/ are unaffected.

import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import type { Plugin } from "vite"
import { type AgentFile, loadAgentData } from "./agent/data.ts"
import { llmsFullTxt, llmsTxt, markdownPages } from "./agent/markdown.ts"
import { SITE_URL } from "./src/seo.ts"

const MARKDOWN = "text/markdown; charset=utf-8"
const TEXT = "text/plain; charset=utf-8"

/** Every agent-facing file: the catalog's assets plus the generated docs. */
async function allFiles(): Promise<Map<string, AgentFile>> {
  const { catalog, files } = await loadAgentData()
  const all = new Map(files)
  const pages = markdownPages(catalog)
  for (const [path, markdown] of pages)
    all.set(path, { contentType: MARKDOWN, read: () => markdown })
  all.set("/llms.txt", { contentType: TEXT, read: () => llmsTxt(catalog) })
  all.set("/llms-full.txt", { contentType: TEXT, read: () => llmsFullTxt(pages) })
  return all
}

/**
 * Cloudflare Pages `_headers`. The markdown twins point search engines at their HTML page as
 * canonical, rather than `noindex` (which answer engines may honor too); `/index.md` drops it,
 * since `:splat` would make its canonical `/index` rather than `/`.
 */
const HEADERS = `# Written by agent-plugin.ts.
/*.md
  Content-Type: text/markdown; charset=utf-8
  Access-Control-Allow-Origin: *
  Link: <${SITE_URL}/:splat>; rel="canonical"
/index.md
  ! Link
/llms.txt
  Content-Type: text/plain; charset=utf-8
  Access-Control-Allow-Origin: *
/llms-full.txt
  Content-Type: text/plain; charset=utf-8
  Access-Control-Allow-Origin: *
/catalog.json
  Access-Control-Allow-Origin: *
/colors.json
  Access-Control-Allow-Origin: *
/colors.css
  Access-Control-Allow-Origin: *
/fonts/*
  Access-Control-Allow-Origin: *
/hoggies/*
  Access-Control-Allow-Origin: *
/crests/*
  Access-Control-Allow-Origin: *
/logo/*
  Access-Control-Allow-Origin: *
`

export function brandAgentFiles(): Plugin {
  let outDir = "dist"

  return {
    name: "brand-agent-files",

    configResolved(config) {
      outDir = config.build.outDir
    },

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = decodeURIComponent((req.url ?? "").split("?")[0] ?? "")
        // Only paths that could be ours, so ordinary dev requests never wait on the catalog.
        if (!/\.(svg|png|md|txt|json|css|woff2)$/.test(path)) return next()
        allFiles()
          .then(async (files) => {
            const file = files.get(path)
            if (!file) return next()
            res.setHeader("Content-Type", file.contentType)
            res.setHeader("Access-Control-Allow-Origin", "*")
            res.end(await file.read())
          })
          .catch(next)
      })
    },

    async closeBundle() {
      const files = await allFiles()
      for (const [path, file] of files) {
        const target = join(outDir, path)
        mkdirSync(dirname(target), { recursive: true })
        writeFileSync(target, await file.read())
      }
      writeFileSync(join(outDir, "_headers"), HEADERS)
      console.log(
        `brand-agent-files: wrote ${files.size} agent files (assets, markdown, llms.txt, catalog.json) into ${outDir}/`,
      )
    },
  }
}
