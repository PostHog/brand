// WebMCP: the site's tools for agents running in the user's browser (document.modelContext,
// https://webmachinelearning.github.io/webmcp/). Definitions live in webmcp-tools.ts; this is
// the behavior.
//
// Tools answer from `/catalog.json` — the same machine-readable catalog the build publishes
// for agents outside the browser — fetched once on the first call, so registering them costs
// the page nothing.
//
// Register *after* posthog-js has initialized (see main.tsx): with `capture_webmcp` on, it
// wraps `document.modelContext.registerTool`, and only tools registered through the wrapper
// are captured as `$mcp_tool_call` events.

import posthog from "posthog-js"
import type { Catalog, CatalogAsset, CatalogColor, CatalogLogo } from "../agent/data.ts"
import { absoluteUrl, assetFileName, assetFilePath, type AssetRef } from "./agent-paths.ts"
import { assetProperties } from "./analytics.ts"
import { inPresetOrder, LOGO_DONTS, LOGO_DOS } from "./logo-files.ts"
import { PAGES } from "./seo.ts"
import { TOOL_DEFINITIONS, type ToolDefinition } from "./webmcp-tools.ts"

interface ModelContextTool extends ToolDefinition {
  execute: (input: Record<string, unknown>) => Promise<unknown>
}

interface ModelContext {
  registerTool: (tool: ModelContextTool) => Promise<void> | void
}

let catalogRequest: Promise<Catalog> | undefined

function loadCatalog(): Promise<Catalog> {
  catalogRequest ??= fetch("/catalog.json").then((res) => {
    if (!res.ok) throw new Error(`catalog.json: HTTP ${res.status}`)
    return res.json() as Promise<Catalog>
  })
  // A failed fetch shouldn't poison every later call.
  catalogRequest.catch(() => (catalogRequest = undefined))
  return catalogRequest
}

let navigate: ((path: string) => void) | undefined

/** Hands the tools the router's navigate, for `open_brand_page`. */
export function setWebMcpNavigate(fn: (path: string) => void): void {
  navigate = fn
}

/** A tool-level failure the agent can read and recover from (MCP's `isError` result shape). */
interface ToolFailure {
  isError: true
  content: { type: "text"; text: string }[]
}

/** Any catalog entry a tool can return: a hoggie, a crest, or a logo file. */
type Entry = CatalogAsset | CatalogLogo

function failure(text: string): ToolFailure {
  return { isError: true, content: [{ type: "text", text }] }
}

const str = (value: unknown): string => (typeof value === "string" ? value : "")

interface Hit {
  type: AssetRef["type"]
  name: string
  haystack: string
  value: Entry
}

function hits(catalog: Catalog): Hit[] {
  const asset = (entry: CatalogAsset): Hit => ({
    type: entry.type,
    name: entry.name,
    haystack: `${entry.name} ${entry.slug} ${entry.tags.join(" ")}`,
    value: entry,
  })
  const logo = (entry: CatalogLogo): Hit => ({
    type: "logo",
    name: entry.title,
    haystack: `${entry.id} ${entry.title} ${entry.layout} ${entry.treatment} ${entry.frame ?? ""} ${entry.preset?.name ?? ""} ${entry.background} background`,
    value: entry,
  })
  return [...catalog.logos.map(logo), ...catalog.hoggies.map(asset), ...catalog.crests.map(asset)]
}

async function search(
  input: Record<string, unknown>,
): Promise<{ total: number; results: Entry[]; note: string }> {
  const catalog = await loadCatalog()
  const query = str(input.query).trim().toLowerCase()
  const words = query.split(/\s+/).filter(Boolean)
  const type = str(input.type)
  const limit = Math.min(50, Math.max(1, Number(input.limit) || 10))
  const matches = hits(catalog)
    .filter((hit) => !type || hit.type === type)
    .filter((hit) => {
      const haystack = hit.haystack.toLowerCase()
      return words.every((word) => haystack.includes(word))
    })
    // Whole-query name matches first, then alphabetical.
    .sort(
      (a, b) =>
        Number(b.name.toLowerCase().includes(query)) -
          Number(a.name.toLowerCase().includes(query)) || a.name.localeCompare(b.name),
    )
  return {
    total: matches.length,
    results: matches.slice(0, limit).map((hit) => hit.value),
    note: "Prefer the SVG URL; in a JS/TS project, `npm install @posthog/brand` and use the `import` instead of downloading.",
  }
}

function findEntry(catalog: Catalog, type: string, slug: string): Entry | undefined {
  if (type === "logo") return catalog.logos.find((logo) => logo.id === slug)
  const list = type === "hoggie" ? catalog.hoggies : type === "crest" ? catalog.crests : []
  return list.find((entry) => entry.slug === slug)
}

async function getAsset(input: Record<string, unknown>): Promise<Entry | ToolFailure> {
  const catalog = await loadCatalog()
  const type = str(input.type)
  const slug = str(input.slug)
  const entry = findEntry(catalog, type, slug)
  if (!entry) return failure(`No ${type} with slug "${slug}". Use search_brand_assets to find it.`)
  return entry
}

async function logoGuidelines(): Promise<{
  presets: CatalogLogo[]
  dos: readonly string[]
  donts: readonly string[]
  allFiles: CatalogLogo[]
  react: string
}> {
  const catalog = await loadCatalog()
  return {
    // The handbook's approved versions; each carries `preset: { name, when }`.
    presets: inPresetOrder(catalog.logos),
    dos: LOGO_DOS,
    donts: LOGO_DONTS,
    allFiles: catalog.logos,
    react:
      'import { Logo } from "@posthog/brand/logo" — <Logo />, <Logo layout="stacked" />, <Logo variant="mono" color="#fff" />, <Logo.Logomark />',
  }
}

async function brandColors(): Promise<{
  colors: CatalogColor[]
  css: string
  json: string
  package: string
}> {
  const catalog = await loadCatalog()
  return {
    colors: catalog.colors,
    css: absoluteUrl("/colors.css"),
    json: absoluteUrl("/colors.json"),
    package: 'import { colors } from "@posthog/brand/colors"',
  }
}

async function download(
  input: Record<string, unknown>,
): Promise<{ downloaded: string; url: string } | ToolFailure> {
  const catalog = await loadCatalog()
  const type = str(input.type)
  const slug = str(input.slug)
  const format = str(input.format) === "png" ? "png" : "svg"
  const entry = findEntry(catalog, type, slug)
  if (!entry) return failure(`No ${type} with slug "${slug}". Use search_brand_assets to find it.`)

  let asset: AssetRef = { type: "logo", slug }
  if (entry.type !== "logo") {
    const { images } = entry
    const image =
      entry.type === "crest"
        ? images.find((img) => img.tier === (str(input.tier) || "full"))
        : (images.find((img) => img.variant === str(input.variant)) ?? images[0])
    if (!image) return failure(`${entry.name} has no ${str(input.tier)} tier.`)
    asset = { type: entry.type, slug, variant: image.variant, tier: image.tier }
  }

  const path = assetFilePath(asset, format)
  const fileName = `${assetFileName(asset)}.${format}`
  const a = document.createElement("a")
  a.href = path
  a.download = fileName
  document.body.append(a)
  a.click()
  a.remove()
  posthog.capture("asset downloaded", { ...assetProperties(asset), format, source: "webmcp" })
  return { downloaded: fileName, url: absoluteUrl(path) }
}

async function openPage(input: Record<string, unknown>): Promise<{ opened: string } | ToolFailure> {
  const path =
    str(input.path)
      .replace(/^https?:\/\/[^/]+/, "")
      .replace(/\/+$/, "") || "/"
  const catalog = await loadCatalog()
  const url = absoluteUrl(path)
  const known =
    PAGES.some((page) => page.path === path) ||
    [...catalog.hoggies, ...catalog.crests].some((entry) => entry.page === url)
  if (!known) {
    return failure(
      `"${path}" isn't a page on this site. Pages: ${PAGES.map((p) => p.path).join(", ")}, /hoggies/<slug>, /crests/<slug>.`,
    )
  }
  if (!navigate) return failure("The page isn't ready to navigate yet.")
  navigate(path)
  return { opened: url }
}

const EXECUTE: Record<string, (input: Record<string, unknown>) => Promise<unknown>> = {
  search_brand_assets: search,
  get_brand_asset: getAsset,
  get_logo_guidelines: logoGuidelines,
  get_brand_colors: brandColors,
  download_brand_asset: download,
  open_brand_page: openPage,
}

/** Registers every tool with the browser's model context, when it has one. */
export function registerWebMcpTools(): void {
  const modelContext = (document as Document & { modelContext?: ModelContext }).modelContext
  if (typeof modelContext?.registerTool !== "function") return
  for (const definition of TOOL_DEFINITIONS) {
    const run = EXECUTE[definition.name]
    if (!run) continue
    const tool: ModelContextTool = {
      ...definition,
      execute: async (input) => {
        try {
          return await run(input ?? {})
        } catch (error) {
          return failure(error instanceof Error ? error.message : String(error))
        }
      },
    }
    try {
      void Promise.resolve(modelContext.registerTool(tool)).catch(() => undefined)
    } catch {
      // A browser whose WebMCP shape differs from the spec: the site works without it.
    }
  }
}
