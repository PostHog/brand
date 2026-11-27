// brand.posthog.com's remote MCP server (https://brand.posthog.com/mcp): PostHog's brand assets for
// agents that don't browse the site. Served by the Pages Function in functions/mcp.ts.
//
// Stateless Streamable HTTP with JSON responses: every request gets a fresh server and transport,
// so nothing is kept between requests and any isolate can answer. The tools answer from the same
// files the site publishes for agents (/catalog.json and the asset files, read through the Pages
// `ASSETS` binding) and with the same code as the site's WebMCP tools (site/src/brand-tools.ts),
// under the same definitions (site/src/webmcp-tools.ts).
//
// Tool calls are captured as `$mcp_tool_call` in posthog.com's project by @posthog/mcp, with the
// agent's stated intent (`context`) and its client and model. Not from localhost.

import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"
import {
  CallToolRequestSchema,
  type CallToolResult,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"
import { instrument } from "@posthog/mcp"
import { PostHog } from "posthog-node"
import { release } from "@posthog/brand"
import type { Catalog } from "../../site/agent/data.ts"
import {
  assetFile,
  brandColors,
  failure,
  getAsset,
  type Input,
  isFailure,
  logoGuidelines,
  searchAssets,
} from "../../site/src/brand-tools.ts"
import { POSTHOG_HOST, POSTHOG_KEY } from "../../site/src/posthog-project.ts"
import { MCP_TOOL_DEFINITIONS } from "../../site/src/webmcp-tools.ts"

/** What the Pages Function hands over: the site's static files. */
export interface Env {
  ASSETS: { fetch: (request: Request | string) => Promise<Response> }
  /** The deployed commit (Pages sets it), recorded as `$mcp_server_build`. */
  CF_PAGES_COMMIT_SHA?: string
  /** Sends analytics somewhere else, e.g. a local sink while testing. Unset: posthog.com's. */
  POSTHOG_HOST?: string
}

export interface Ctx {
  waitUntil: (promise: Promise<unknown>) => void
}

const INSTRUCTIONS = `PostHog's brand assets: the logo, the hedgehog illustrations ("hoggies"), team crests, brand colors and "Built with PostHog" website badges, from https://brand.posthog.com.

Find assets with search_brand_assets, then get_brand_asset for every version of one, or get_brand_asset_file for the file itself: an SVG comes back as markup you can write to a file as-is, a PNG as an image, both with a URL to download. Call get_logo_guidelines before picking a logo. In a JavaScript or TypeScript project, prefer \`npm install @posthog/brand\` and the import each asset lists over copying files.

The assets are PostHog's: use them to make things for or about PostHog, under the license at https://github.com/PostHog/brand/blob/main/LICENSE.`

const json = (value: unknown): CallToolResult => ({
  content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
})

function base64(bytes: ArrayBuffer): string {
  const view = new Uint8Array(bytes)
  let bin = ""
  for (let i = 0; i < view.length; i += 0x8000)
    bin += String.fromCharCode(...view.subarray(i, i + 0x8000))
  return btoa(bin)
}

/** The site's catalog, once per isolate: it only changes with a deploy, which starts new ones. */
let catalogRequest: Promise<Catalog> | undefined

function loadCatalog(env: Env, origin: string): Promise<Catalog> {
  catalogRequest ??= env.ASSETS.fetch(`${origin}/catalog.json`).then((res) => {
    if (!res.ok) throw new Error(`catalog.json: HTTP ${res.status}`)
    return res.json() as Promise<Catalog>
  })
  catalogRequest.catch(() => (catalogRequest = undefined))
  return catalogRequest
}

type Run = (input: Input) => Promise<CallToolResult>

function tools(env: Env, origin: string): Record<string, Run> {
  const catalog = () => loadCatalog(env, origin)
  const answer = (value: unknown): CallToolResult =>
    isFailure(value) ? (value as CallToolResult) : json(value)
  return {
    search_brand_assets: async (input) => answer(searchAssets(await catalog(), input)),
    get_brand_asset: async (input) => answer(getAsset(await catalog(), input)),
    get_logo_guidelines: async () => answer(logoGuidelines(await catalog())),
    get_brand_colors: async () => answer(brandColors(await catalog())),
    get_brand_asset_file: async (input) => {
      const file = assetFile(await catalog(), input)
      if (isFailure(file)) return file as CallToolResult
      const url = `${origin}${file.path}`
      const res = await env.ASSETS.fetch(url)
      if (!res.ok) return failure(`${file.path}: HTTP ${res.status}`) as CallToolResult
      const about = `${file.fileName}, from ${url}`
      if (file.format === "svg")
        return {
          content: [
            {
              type: "text",
              text: `${about}. The SVG markup follows; save it as ${file.fileName}.`,
            },
            { type: "text", text: await res.text() },
          ],
        }
      return {
        content: [
          { type: "text", text: `${about}. To save the PNG, download that URL.` },
          { type: "image", data: base64(await res.arrayBuffer()), mimeType: "image/png" },
        ],
      }
    },
  }
}

function createServer(env: Env, origin: string, posthog: PostHog | null) {
  const server = new Server(
    { name: "posthog-brand", title: "PostHog Brand", version: release.version },
    { capabilities: { tools: {} }, instructions: INSTRUCTIONS },
  )
  if (posthog)
    instrument(server, posthog, {
      context: true,
      ...(env.CF_PAGES_COMMIT_SHA ? { serverBuild: env.CF_PAGES_COMMIT_SHA } : {}),
    })
  const run = tools(env, origin)
  server.setRequestHandler(ListToolsRequestSchema, () => ({ tools: [...MCP_TOOL_DEFINITIONS] }))
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = run[request.params.name]
    if (!tool) return failure(`No tool named ${request.params.name}.`) as CallToolResult
    try {
      return await tool(request.params.arguments ?? {})
    } catch (error) {
      return failure(error instanceof Error ? error.message : String(error)) as CallToolResult
    }
  })
  return server
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Accept, Authorization, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-ID",
  "Access-Control-Expose-Headers": "Mcp-Session-Id, Mcp-Protocol-Version",
}

function withCors(response: Response): Response {
  const out = new Response(response.body, response)
  for (const [k, v] of Object.entries(CORS)) out.headers.set(k, v)
  return out
}

const ABOUT = `This is PostHog Brand's MCP server: PostHog's logo, hoggies, crests, colors and website badges for AI agents.

Add it to your MCP client as a remote (Streamable HTTP) server:

  https://brand.posthog.com/mcp

e.g. Claude Code: claude mcp add --transport http posthog-brand https://brand.posthog.com/mcp

Docs: https://brand.posthog.com/llms.txt
`

/** Answers one HTTP request to /mcp. */
export async function handleMcp(request: Request, env: Env, ctx: Ctx): Promise<Response> {
  if (request.method === "OPTIONS") return withCors(new Response(null, { status: 204 }))
  // A person opening the URL in a browser gets a note instead of a protocol error.
  if (request.method === "GET" && !request.headers.get("accept")?.includes("text/event-stream"))
    return withCors(
      new Response(ABOUT, { headers: { "Content-Type": "text/plain; charset=utf-8" } }),
    )

  const url = new URL(request.url)
  // Local runs don't report to the real project, unless pointed at a sink.
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1"
  const posthog =
    local && !env.POSTHOG_HOST
      ? null
      : new PostHog(POSTHOG_KEY, {
          host: env.POSTHOG_HOST ?? POSTHOG_HOST,
          flushAt: 1,
          flushInterval: 0,
        })
  const server = createServer(env, url.origin, posthog)
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  })
  await server.connect(transport)
  const response = await transport.handleRequest(request)
  // JSON mode: the tool call has been captured by the time the response exists. Send it after
  // the response goes out (@posthog/mcp 1.6 has no flush of its own, so flush posthog-node;
  // the next tick lets a capture that resolves after the response reach the queue first).
  if (posthog)
    ctx.waitUntil(
      new Promise((resolve) => setTimeout(resolve, 0)).then(() => posthog.shutdown(5000)),
    )
  return withCors(response)
}
