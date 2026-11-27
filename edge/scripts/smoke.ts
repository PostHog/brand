// Calls every tool on a brand MCP server with the official MCP client, and prints what comes back,
// so a deploy (or `pnpm dev:edge`) can be checked end to end.
//
//   node edge/scripts/smoke.ts [url]        default http://localhost:8788/mcp
//
// Exits non-zero if a call fails or returns something unexpected.

import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js"

const url = new URL(process.argv[2] ?? "http://localhost:8788/mcp")
const client = new Client({ name: "brand-smoke", version: "1.0.0" })
await client.connect(new StreamableHTTPClientTransport(url))

let failures = 0
function check(label: string, ok: boolean, detail = "") {
  console.log(`${ok ? "ok  " : "FAIL"} ${label}${detail ? `: ${detail}` : ""}`)
  if (!ok) failures++
}

type Content = { type: string; text?: string; data?: string; mimeType?: string }

async function call(name: string, args: Record<string, unknown>) {
  const res = (await client.callTool({ name, arguments: { context: "smoke test", ...args } })) as {
    content: Content[]
    isError?: boolean
  }
  return res
}

const firstText = (content: Content[]) => content.find((c) => c.type === "text")?.text ?? ""

const { tools } = await client.listTools()
check("tools/list", tools.length > 0, tools.map((t) => t.name).join(", "))

const search = await call("search_brand_assets", { query: "coffee", type: "hoggie", limit: 3 })
const found = JSON.parse(firstText(search.content)) as {
  total: number
  results: { slug: string }[]
}
check(
  "search_brand_assets",
  !search.isError && found.total > 0,
  found.results.map((r) => r.slug).join(", "),
)

const slug = found.results[0]?.slug ?? "chart"
const asset = await call("get_brand_asset", { type: "hoggie", slug })
check("get_brand_asset", !asset.isError && firstText(asset.content).includes(`"slug": "${slug}"`))

const logos = await call("get_logo_guidelines", {})
check("get_logo_guidelines", !logos.isError && firstText(logos.content).includes('"presets"'))

const colors = await call("get_brand_colors", {})
check("get_brand_colors", !colors.isError && firstText(colors.content).includes('"colors"'))

const svg = await call("get_brand_asset_file", { type: "hoggie", slug, format: "svg" })
const markup = svg.content[1]?.text ?? ""
check(
  "get_brand_asset_file svg",
  !svg.isError && markup.startsWith("<svg"),
  `${markup.length} chars`,
)

const png = await call("get_brand_asset_file", {
  type: "crest",
  slug: "marketing",
  format: "png",
  tier: "mini",
})
const image = png.content.find((c) => c.type === "image")
check(
  "get_brand_asset_file png",
  !png.isError && image?.mimeType === "image/png" && !!image.data,
  `${Math.round(((image?.data?.length ?? 0) * 3) / 4 / 1024)} KB`,
)

const missing = await call("get_brand_asset", { type: "hoggie", slug: "no-such-hoggie" })
check("unknown asset is an error result", missing.isError === true, firstText(missing.content))

await client.close()
console.log(failures ? `${failures} failed` : "All tools OK")
process.exit(failures ? 1 : 0)
