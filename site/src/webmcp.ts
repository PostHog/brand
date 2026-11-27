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
import type { Catalog } from "../agent/data.ts"
import { absoluteUrl } from "./agent-paths.ts"
import { assetProperties } from "./analytics.ts"
import {
  assetFile,
  brandColors as catalogBrandColors,
  failure,
  getAsset as getCatalogAsset,
  type Input,
  isFailure,
  logoGuidelines as catalogLogoGuidelines,
  searchAssets,
  str,
  type ToolFailure,
} from "./brand-tools.ts"
import type { MakerSlug } from "./image-maker/catalog.ts"
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

async function search(input: Input) {
  return searchAssets(await loadCatalog(), input)
}

async function getAsset(input: Input) {
  return getCatalogAsset(await loadCatalog(), input)
}

async function logoGuidelines() {
  return catalogLogoGuidelines(await loadCatalog())
}

async function brandColors() {
  return catalogBrandColors(await loadCatalog())
}

async function download(input: Input): Promise<{ downloaded: string; url: string } | ToolFailure> {
  const file = assetFile(await loadCatalog(), input)
  if (isFailure(file)) return file
  const a = document.createElement("a")
  a.href = file.path
  a.download = file.fileName
  document.body.append(a)
  a.click()
  a.remove()
  posthog.capture("asset downloaded", {
    ...assetProperties(file.asset),
    format: file.format,
    source: "webmcp",
  })
  return { downloaded: file.fileName, url: absoluteUrl(file.path) }
}

async function openPage(input: Record<string, unknown>): Promise<{ opened: string } | ToolFailure> {
  const path =
    str(input.path)
      .replace(/^https?:\/\/[^/]+/, "")
      .replace(/[?#].*$/, "")
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

/**
 * A make_*_image tool: draws the image with the maker (image-maker/agent.ts, loaded on the first
 * call) and answers in MCP's content shape, so the agent gets the preview as an image it can see.
 */
function imageMaker(slug: MakerSlug) {
  return async (input: Record<string, unknown>) => {
    const { show, download, scale, size, ...request } = input
    const { makeImage } = await import("./image-maker/agent.ts")
    const { image, ...result } = await makeImage(slug, request, {
      show: show === true,
      download: download === true,
      scale: scale === 2 ? 2 : 1,
      size: typeof size === "string" ? size : undefined,
      navigate,
    })
    return {
      content: [
        { type: "text", text: JSON.stringify(result, null, 2) },
        { type: "image", data: image, mimeType: "image/jpeg" },
      ],
    }
  }
}

const EXECUTE: Record<string, (input: Record<string, unknown>) => Promise<unknown>> = {
  make_customer_story_image: imageMaker("customer-stories"),
  make_blog_image: imageMaker("blog"),
  make_event_image: imageMaker("events"),
  make_build_mode_image: imageMaker("build-mode"),
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
