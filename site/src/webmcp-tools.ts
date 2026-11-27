// The WebMCP tools this site registers, as data: name, description, input schema, hints.
// The behavior lives in webmcp.ts (browser only); this half is shared so the build can list
// the same tools in the agent docs (agent/markdown.ts) without pulling in browser code.
//
// Input schemas stay plain `{ type: "object", properties, required }`: posthog-js adds its
// `context` (intent) and `llm_model` fields to schemas of exactly that shape when it wraps a
// tool for `$mcp_tool_call` capture.

import type {
  ColorKey as BlogColor,
  HlKey as BlogHighlight,
} from "./image-maker/makers/blog/model.ts"
import type { FormatKey, HlKey as BuildHighlight } from "./image-maker/makers/build/model.ts"
import type { ColorKey as CustomerColor } from "./image-maker/makers/customer/model.ts"
import type { ColorKey as EventColor } from "./image-maker/makers/event/model.ts"

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
  enum: ["hoggie", "crest", "logo", "badge"],
  description:
    'Which kind of asset: "hoggie" (a hedgehog illustration), "crest" (a team crest), "logo" (a logo file) or "badge" (a "Built with PostHog" website badge for other sites to embed, whose entry includes ready-to-paste HTML and Markdown embed code and the terms of use).',
}

// ---- Image makers ----
// One tool per maker, each taking the same settings as its `#new-<hex JSON>` link (the maker's
// `fromRequest`) plus what to do with the result. The value lists are checked against each
// maker's own types below, so a new color can't be missing here.

/** Every value of a string union, checked to be complete: `all<T>()([...])`. */
const all =
  <T extends string>() =>
  <L extends readonly T[]>(list: L & ([T] extends [L[number]] ? unknown : "missing a value")) =>
    list

const COLORS = all<BlogColor & CustomerColor & EventColor>()([
  "blue",
  "yellow",
  "teal",
  "purple",
  "corn-blue",
  "coral",
  "tangerine",
  "lime",
  "green",
  "violet",
  "cobalt",
  "lemon",
] as const)
const BLOG_HIGHLIGHTS = all<BlogHighlight>()([
  "blue",
  "teal",
  "purple",
  "tangerine",
  "green",
  "white",
] as const)
const BUILD_HIGHLIGHTS = all<BuildHighlight>()(["teal", "purple", "tangerine", "blue"] as const)
const BUILD_SIZES = all<FormatKey>()(["LinkedIn", "Website", "X", "Substack"] as const)

const color = (description: string) => ({ type: "string", enum: COLORS, description })

const HOGGIE = {
  type: "string",
  description:
    'A hoggie by name or slug, as search_brand_assets returns them ("Burning Money" or "burning-money"; a variant family\'s later members add their key: "Noir 2" or "noir-2").',
}

/** The hoggie placement settings, in a maker's own slider ranges. */
function placement(size: readonly [number, number], move: number, extra = "") {
  return {
    hoggieSize: {
      type: "number",
      minimum: size[0],
      maximum: size[1],
      description: `The hoggie's size in percent (${size[0]}–${size[1]}, default 100).${extra}`,
    },
    hoggieX: {
      type: "number",
      minimum: -move,
      maximum: move,
      description: `Moves the hoggie sideways (-${move}–${move}, right is positive, default 0).`,
    },
    hoggieY: {
      type: "number",
      minimum: -move,
      maximum: move,
      description: `Moves the hoggie up or down (-${move}–${move}, up is positive, default 0).`,
    },
    flip: { type: "boolean", description: "Mirrors the hoggie." },
  }
}

const PICTURE =
  "an https URL whose server allows cross-origin requests (res.cloudinary.com, where posthog.com keeps its images, does), a data:image URL, or a path on this site (/logo/…, /hoggies/…)"

const OUTPUT = {
  show: {
    type: "boolean",
    description:
      "Also open the image in the maker on this page, saved in the user's list, where they can change it and download it. Leave it off while trying ideas; turn it on for the one to keep.",
  },
  download: {
    type: "boolean",
    description: "Also save the PNG to the user's computer, as a normal browser download.",
  },
}
const SCALE = {
  type: "integer",
  enum: [1, 2],
  description: "Download at 1x (default) or 2x.",
}

const RETURNS =
  "Returns a preview of the image to check, the link that reopens it in the maker (`?image=`), what the maker decided (the hoggie it matched, where the logo came from…) and `warnings` to fix. Nothing is saved or downloaded unless you ask with `show` or `download`."

function imageMakerTools(): ToolDefinition[] {
  return [
    {
      name: "make_customer_story_image",
      title: "Make a PostHog customer story image",
      description: `Make a 1920 × 1080 customer story header: the company's logo, a hoggie and a brand color. The logo comes from the posthog.com/customers logos when the company is there; otherwise pass \`logoUrl\`. ${RETURNS}`,
      inputSchema: {
        type: "object",
        properties: {
          company: {
            type: "string",
            description:
              'The company\'s name or website, e.g. "Supabase" or "supabase.com". Looked up in the posthog.com/customers logos.',
          },
          logoUrl: {
            type: "string",
            description: `The logo, when the maker doesn't have it: ${PICTURE}. A transparent PNG or an SVG of the full-color or dark logo works best.`,
          },
          logoMode: {
            type: "string",
            enum: ["match", "original"],
            description:
              '"match" draws the logo in one color, the text color (the default for most logos); "original" keeps its own colors. Use "original" for a logo on a filled plate or badge, which "match" paints as a solid block.',
          },
          hoggie: {
            ...HOGGIE,
            description: `${HOGGIE.description} Leave it out to pick one for the company.`,
          },
          ...placement([75, 125], 20),
          color: color("Background color. Default blue."),
          tone: {
            type: "string",
            enum: ["light", "mid", "dark"],
            description: "Background tone. Default mid (full color).",
          },
          ink: {
            type: "string",
            enum: ["light", "dark"],
            description: "Text and logo color: light (white, the default) or dark.",
          },
          ...OUTPUT,
          scale: SCALE,
        },
        required: ["company"],
        additionalProperties: false,
      },
    },
    {
      name: "make_blog_image",
      title: "Make a PostHog blog image",
      description: `Make a 1920 × 1080 blog or newsletter header: the title with a highlighted phrase, up to 3 authors and a hoggie matched to the title. ${RETURNS}`,
      inputSchema: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "The post title. It wraps on its own; `|` forces a line break.",
          },
          highlight: {
            type: "string",
            description: "A word or phrase from the title to highlight.",
          },
          description: {
            type: "string",
            description:
              "One or two sentences about the post. Not drawn: it helps match the hoggie.",
          },
          authors: {
            type: "array",
            items: { type: "string" },
            maxItems: 3,
            description: "Up to 3 author names.",
          },
          hoggie: {
            ...HOGGIE,
            description: `${HOGGIE.description} Leave it out to match one to the title.`,
          },
          ...placement([75, 125], 20),
          color: color("Background color. Random when left out."),
          tone: { type: "string", enum: ["light", "mid", "dark"], description: "Background tone." },
          textColor: {
            type: "string",
            enum: ["dark", "white"],
            description: "Text color on the mid tone.",
          },
          highlightColor: {
            type: "string",
            enum: BLOG_HIGHLIGHTS,
            description:
              "Highlight color. white only works on white text (dark tone, or mid with white text).",
          },
          seo: {
            type: "boolean",
            description: "An SEO / AEO post: limits the hoggies and colors to that set.",
          },
          ...OUTPUT,
          scale: SCALE,
        },
        required: ["title"],
        additionalProperties: false,
      },
    },
    {
      name: "make_event_image",
      title: "Make a PostHog event image",
      description: `Make a 1080 × 1080 event post: a headline, a calendar tile with the date, the time and place, a hoggie or a photo, and up to 4 partner logos. ${RETURNS}`,
      inputSchema: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description:
              "The headline. A new line (\\n) breaks it; **words** are bold, and with any marked, the rest go lighter and smaller.",
          },
          headline: {
            type: "string",
            enum: ["fit", "even"],
            description:
              '"fit" (default): each line fills the width. "even": the lines share one size.',
          },
          date: { type: "string", description: "YYYY-MM-DD. Default: two weeks from today." },
          start: { type: "string", description: "Start time, 24-hour HH:MM." },
          end: { type: "string", description: "End time, 24-hour HH:MM." },
          timezone: { type: "string", description: 'Shown after the time, e.g. "PT" or "GMT".' },
          location: { type: "string", description: 'e.g. "Venue, City".' },
          color: color("Background color. Default blue."),
          calendarColor: color("Calendar tile color. Default tangerine."),
          footerColor: {
            type: "string",
            enum: [...COLORS, "white"],
            description: "Footer color. Default white.",
          },
          darkText: { type: "boolean", description: "Dark text instead of white." },
          hoggie: { ...HOGGIE, description: `${HOGGIE.description} Leave it out for none.` },
          ...placement(
            [50, 200],
            50,
            " Leave hoggieSize, hoggieX and hoggieY out to have the hoggie placed clear of the date, time and location.",
          ),
          photoUrl: {
            type: "string",
            description: `A photo, drawn in front of the hoggie: ${PICTURE}.`,
          },
          logos: {
            type: "array",
            items: { type: "string" },
            maxItems: 4,
            description: `Partner logos for the footer, next to PostHog's: each ${PICTURE}.`,
          },
          logoColor: {
            type: "string",
            enum: ["auto", "white", "black"],
            description: "The footer logos' color. auto suits the footer color.",
          },
          ...OUTPUT,
          scale: SCALE,
        },
        required: ["title"],
        additionalProperties: false,
      },
    },
    {
      name: "make_build_mode_image",
      title: "Make a PostHog build mode image",
      description: `Make build mode art on the blueprint grid: a title with a highlighted phrase, a picture and the authors, at four sizes (LinkedIn 1920 × 1080, Website 1920 × 1080, X 1500 × 600, Substack 1200 × 630). The preview is the LinkedIn size, or \`size\`. ${RETURNS}`,
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string", description: "The title. `|` or a new line forces a break." },
          highlight: {
            type: "string",
            description: "A word or phrase from the title to highlight.",
          },
          highlightColor: {
            type: "string",
            enum: BUILD_HIGHLIGHTS,
            description: "Highlight color.",
          },
          authors: {
            type: "array",
            items: { type: "string" },
            maxItems: 3,
            description:
              "Up to 3 authors; only people with a photo on this site (the error lists them).",
          },
          imageUrl: { type: "string", description: `The picture on the grid: ${PICTURE}.` },
          size: {
            type: "string",
            enum: BUILD_SIZES,
            description: "Preview (and download) only this size. Downloads all four when left out.",
          },
          ...OUTPUT,
        },
        required: ["title"],
        additionalProperties: false,
      },
    },
  ]
}

export const TOOL_DEFINITIONS: readonly ToolDefinition[] = [
  {
    name: "search_brand_assets",
    title: "Search PostHog brand assets",
    description:
      'Search PostHog\'s brand assets (hedgehog illustrations or "hoggies", team crests, logo files, and "Built with PostHog" website badges) by name, slug, or tag. Returns each match\'s static SVG/PNG URLs, its page, and the @posthog/brand import that renders it.',
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
      'Everything about one asset by type and slug (a logo\'s slug is its file id, e.g. "posthog-logo-stacked-white"; a website badge\'s is its id, "posthog-badge" or "posthog-badge-dark"): every variant or tier with its SVG/PNG URLs and PNG size, the JSX and import for @posthog/brand, and its tags. A website badge has no JSX or import: it returns its embed `html` and `markdown`, its `link`, and the `usage` terms.',
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
        slug: { type: "string", description: "The asset slug (or logo file or website badge id)." },
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
      'Navigate this site to a page so the user can see it: "/", "/logo", "/fonts", "/colors", "/hoggies", "/crests", "/badges", or one asset\'s page ("/hoggies/<slug>", "/crests/<slug>").',
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: 'Site path, e.g. "/hoggies/chart".' },
      },
      required: ["path"],
      additionalProperties: false,
    },
  },
  ...imageMakerTools(),
]

// ---- The remote MCP server (https://brand.posthog.com/mcp, edge/src/mcp.ts) ----
// The same asset tools, for agents that don't run the site in a browser, plus the file itself
// where the browser's download_brand_asset saves it.

function named(name: string): ToolDefinition {
  const found = TOOL_DEFINITIONS.find((tool) => tool.name === name)
  if (!found) throw new Error(`No tool definition named ${name}`)
  return found
}

export const MCP_TOOL_DEFINITIONS: readonly ToolDefinition[] = [
  named("search_brand_assets"),
  named("get_brand_asset"),
  named("get_logo_guidelines"),
  named("get_brand_colors"),
  {
    name: "get_brand_asset_file",
    title: "Get a PostHog brand asset file",
    description:
      "One asset file's contents: an SVG comes back as its markup (write it to a file as-is), a PNG as an image, each with its file name and a URL to download it (e.g. with curl). For a hoggie variant family pass `variant`; for a crest's mini badge pass tier \"mini\".",
    inputSchema: named("download_brand_asset").inputSchema,
    annotations: { readOnlyHint: true },
  },
]

const MCP_RETURNS =
  "Drawn on brand.posthog.com by the maker itself. Returns a preview of the image to check, `png`: the URL of the full-size PNG (download it, embed it or hand it on; build mode lists one per size), `link`: the maker with the image open, where a person can change it, what the maker decided (the hoggie it matched, where the logo came from…) and `warnings` to fix."

/**
 * The make_*_image tools on the remote MCP server: the same settings as the WebMCP tools, minus
 * what only a browser tab can do (`show`, `download`). Listed only where the server can render
 * (the RENDER binding, edge/src/mcp.ts).
 */
export const MCP_IMAGE_TOOL_DEFINITIONS: readonly ToolDefinition[] = imageMakerTools().map(
  (tool) => {
    const { show: _show, download: _download, ...properties } = tool.inputSchema.properties
    return {
      ...tool,
      description: tool.description.replace(RETURNS, MCP_RETURNS),
      inputSchema: { ...tool.inputSchema, properties },
      annotations: { readOnlyHint: true },
    }
  },
)
