// The WebMCP tools this site registers, as data: name, description, input schema, hints.
// The behavior lives in webmcp.ts (browser only); this half is shared so the build can list
// the same tools in the agent docs (agent/markdown.ts) without pulling in browser code.
//
// Input schemas stay plain `{ type: "object", properties, required }`: posthog-js adds its
// `context` (intent) and `llm_model` fields to schemas of exactly that shape when it wraps a
// tool for `$mcp_tool_call` capture.

export interface ToolDefinition {
  name: string
  title: string
  description: string
  inputSchema: {
    type: "object"
    properties: Record<string, object>
    required?: string[]
    additionalProperties?: false
  }
  annotations?: { readOnlyHint?: boolean }
}

const ASSET_TYPE = {
  type: "string",
  enum: ["hoggie", "crest", "logo"],
  description:
    'Which kind of asset: "hoggie" (a hedgehog illustration), "crest" (a team crest) or "logo" (a logo file).',
}

export const TOOL_DEFINITIONS: readonly ToolDefinition[] = [
  {
    name: "search_brand_assets",
    title: "Search PostHog brand assets",
    description:
      "Search PostHog's brand assets — hedgehog illustrations (\"hoggies\"), team crests and logo files — by name, slug or tag. Returns each match's static SVG/PNG URLs, its page, and the @posthog/brand import that renders it.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            'Words to match against names, slugs and tags, e.g. "coffee", "marketing", "stacked white". Empty lists everything.',
        },
        type: { ...ASSET_TYPE, description: `Optional filter. ${ASSET_TYPE.description}` },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 50,
          description: "Most results to return (default 10).",
        },
      },
      required: ["query"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: "get_brand_asset",
    title: "Get a PostHog brand asset",
    description:
      'Everything about one asset by type and slug (a logo\'s slug is its file id, e.g. "posthog-logo-stacked-white"): every variant or tier with its SVG/PNG URLs and PNG size, the JSX and import for @posthog/brand, and its tags.',
    inputSchema: {
      type: "object",
      properties: {
        type: ASSET_TYPE,
        slug: { type: "string", description: 'The asset slug, e.g. "chart" or "marketing".' },
      },
      required: ["type", "slug"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: "get_logo_guidelines",
    title: "PostHog logo guidelines",
    description:
      "Which PostHog logo to use where: the approved logo versions with when to use each, the do's and don'ts, and the SVG/PNG URL of every logo file. Call this before picking a logo.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true },
  },
  {
    name: "get_brand_colors",
    title: "PostHog brand colors",
    description:
      "PostHog's brand color palette: every color's core, lighter and darker hex values, its gradient, and its CSS custom property.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true },
  },
  {
    name: "download_brand_asset",
    title: "Download a PostHog brand asset",
    description:
      "Save an asset's SVG or PNG to the user's computer, as a normal browser download. For a hoggie variant family pass `variant`; for a crest's mini badge pass tier \"mini\".",
    inputSchema: {
      type: "object",
      properties: {
        type: ASSET_TYPE,
        slug: { type: "string", description: "The asset slug (or logo file id)." },
        format: { type: "string", enum: ["svg", "png"], description: "File format." },
        variant: {
          type: "string",
          description: 'Hoggie variant key, e.g. "2". Defaults to the first variant.',
        },
        tier: {
          type: "string",
          enum: ["full", "mini"],
          description: 'Crest tier. Defaults to "full".',
        },
      },
      required: ["type", "slug", "format"],
      additionalProperties: false,
    },
  },
  {
    name: "open_brand_page",
    title: "Show a page of PostHog Brand",
    description:
      'Navigate this site to a page so the user can see it: "/", "/logo", "/fonts", "/colors", "/hoggies", "/crests", or one asset\'s page ("/hoggies/<slug>", "/crests/<slug>").',
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: 'Site path, e.g. "/hoggies/chart".' },
      },
      required: ["path"],
      additionalProperties: false,
    },
  },
]
