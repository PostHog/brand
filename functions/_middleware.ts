// Cloudflare Pages middleware for brand.posthog.com (the site in `site/`; Pages reads
// `functions/` from the project root, which is the repo root). Which paths reach it is set by
// the `_routes.json` that `site/agent-plugin.ts` writes: everything but the hashed bundle and
// the icons.
//
// It does three things, none of which may ever break the response:
//
//   1. Analytics for what posthog-js can't see. Agents fetch llms.txt, the .md pages,
//      catalog.json and the .svg/.png files directly and never run JavaScript, so this sends a
//      `brand resource fetched` event to PostHog for every such file, and for HTML pages
//      fetched by a crawler, assistant or script (browsers' page views come from posthog-js).
//      It's sent from `waitUntil`, after the response is on its way.
//   2. Markdown negotiation: a page requested with `Accept: text/markdown` gets its markdown
//      twin (`/hoggies/chart` → `/hoggies/chart.md`).
//   3. Agent headers: CORS on the agent files, the markdown content type, and links between
//      each page and its markdown. Pages skips `_headers` for Function responses, so they're
//      set here too.
//
// Kept self-contained on purpose: every file under `functions/` becomes a route.

const POSTHOG_KEY = "sTMFPsFhdP1Ssg"
const POSTHOG_CAPTURE_URL = "https://us.i.posthog.com/i/v0/e/"
const SITE_URL = "https://brand.posthog.com"

/** The slice of the Pages Functions context this uses. */
interface PagesContext {
  request: Request & { cf?: { country?: string } }
  next: () => Promise<Response>
  env: { ASSETS: { fetch: (input: Request | URL | string) => Promise<Response> } }
  waitUntil: (promise: Promise<unknown>) => void
}

export type AgentCategory =
  | "ai_crawler"
  | "ai_search"
  | "ai_assistant"
  | "search_crawler"
  | "social_preview"
  | "http_client"
  | "other_bot"
  | "browser"

export interface Agent {
  /** Product token, e.g. "ClaudeBot", "curl"; "browser" for a regular browser. */
  name: string
  operator?: string
  category: AgentCategory
}

/** Known user agents, most specific first. `pattern` is matched case-insensitively. */
const KNOWN_AGENTS: [pattern: string, name: string, operator: string, category: AgentCategory][] = [
  // AI: training crawlers, search indexers, and fetches made for a user mid-conversation.
  ["GPTBot", "GPTBot", "OpenAI", "ai_crawler"],
  ["OAI-SearchBot", "OAI-SearchBot", "OpenAI", "ai_search"],
  ["ChatGPT-User", "ChatGPT-User", "OpenAI", "ai_assistant"],
  ["ClaudeBot", "ClaudeBot", "Anthropic", "ai_crawler"],
  ["Claude-SearchBot", "Claude-SearchBot", "Anthropic", "ai_search"],
  ["Claude-User", "Claude-User", "Anthropic", "ai_assistant"],
  ["anthropic-ai", "anthropic-ai", "Anthropic", "ai_crawler"],
  ["PerplexityBot", "PerplexityBot", "Perplexity", "ai_search"],
  ["Perplexity-User", "Perplexity-User", "Perplexity", "ai_assistant"],
  ["Google-CloudVertexBot", "Google-CloudVertexBot", "Google", "ai_assistant"],
  ["GoogleOther", "GoogleOther", "Google", "ai_crawler"],
  ["meta-externalagent", "meta-externalagent", "Meta", "ai_crawler"],
  ["meta-externalfetcher", "meta-externalfetcher", "Meta", "ai_assistant"],
  ["MistralAI-User", "MistralAI-User", "Mistral", "ai_assistant"],
  ["DuckAssistBot", "DuckAssistBot", "DuckDuckGo", "ai_assistant"],
  ["cohere-ai", "cohere-ai", "Cohere", "ai_crawler"],
  ["cohere-training-data-crawler", "cohere-training-data-crawler", "Cohere", "ai_crawler"],
  ["Amazonbot", "Amazonbot", "Amazon", "ai_crawler"],
  ["Applebot-Extended", "Applebot-Extended", "Apple", "ai_crawler"],
  ["Bytespider", "Bytespider", "ByteDance", "ai_crawler"],
  ["CCBot", "CCBot", "Common Crawl", "ai_crawler"],
  ["YouBot", "YouBot", "You.com", "ai_search"],
  ["Diffbot", "Diffbot", "Diffbot", "ai_crawler"],
  // Search engines.
  ["Googlebot", "Googlebot", "Google", "search_crawler"],
  ["bingbot", "bingbot", "Microsoft", "search_crawler"],
  ["Applebot", "Applebot", "Apple", "search_crawler"],
  ["DuckDuckBot", "DuckDuckBot", "DuckDuckGo", "search_crawler"],
  ["YandexBot", "YandexBot", "Yandex", "search_crawler"],
  ["Baiduspider", "Baiduspider", "Baidu", "search_crawler"],
  // Link previews.
  ["Slackbot", "Slackbot", "Slack", "social_preview"],
  ["Twitterbot", "Twitterbot", "X", "social_preview"],
  ["facebookexternalhit", "facebookexternalhit", "Meta", "social_preview"],
  ["LinkedInBot", "LinkedInBot", "LinkedIn", "social_preview"],
  ["Discordbot", "Discordbot", "Discord", "social_preview"],
  ["TelegramBot", "TelegramBot", "Telegram", "social_preview"],
  ["WhatsApp", "WhatsApp", "Meta", "social_preview"],
  ["redditbot", "redditbot", "Reddit", "social_preview"],
  // Scripts and coding agents' HTTP clients.
  ["curl/", "curl", "", "http_client"],
  ["Wget/", "Wget", "", "http_client"],
  ["python-requests", "python-requests", "", "http_client"],
  ["python-httpx", "python-httpx", "", "http_client"],
  ["aiohttp", "aiohttp", "", "http_client"],
  ["Python-urllib", "Python-urllib", "", "http_client"],
  ["node-fetch", "node-fetch", "", "http_client"],
  ["undici", "undici", "", "http_client"],
  ["axios/", "axios", "", "http_client"],
  ["Go-http-client", "Go-http-client", "", "http_client"],
  ["okhttp", "okhttp", "", "http_client"],
  ["HTTPie", "HTTPie", "", "http_client"],
  ["PostmanRuntime", "PostmanRuntime", "Postman", "http_client"],
  ["Java/", "Java", "", "http_client"],
]

/** Who's asking, from the User-Agent header. */
export function classifyUserAgent(userAgent: string | null): Agent {
  const ua = userAgent?.trim() ?? ""
  if (!ua) return { name: "unknown", category: "http_client" }
  const lower = ua.toLowerCase()
  for (const [pattern, name, operator, category] of KNOWN_AGENTS) {
    if (lower.includes(pattern.toLowerCase())) {
      return operator ? { name, operator, category } : { name, category }
    }
  }
  if (/bot|crawl|spider|scrape|fetch/i.test(ua)) {
    return { name: ua.split(/[\s/;(]/)[0] || "bot", category: "other_bot" }
  }
  if (ua.startsWith("Mozilla/5.0 ")) return { name: "browser", category: "browser" }
  return { name: ua.split(/[\s/;(]/)[0] || "unknown", category: "http_client" }
}

/** A page route: no file extension in the last segment. */
function isPagePath(pathname: string): boolean {
  return !/\.[a-z0-9]+$/i.test(pathname)
}

/** `/` → `/index.md`, `/hoggies/chart/` → `/hoggies/chart.md`. */
export function markdownPathFor(pathname: string): string {
  const path = pathname.replace(/\/+$/, "")
  return path ? `${path}.md` : "/index.md"
}

/** The HTML page a markdown twin belongs to: `/index.md` → `/`. */
function pagePathFor(markdownPath: string): string {
  return markdownPath === "/index.md" ? "/" : markdownPath.slice(0, -".md".length)
}

/** Whether the client asked for markdown over HTML (by `Accept` q-values; ties go to markdown). */
export function prefersMarkdown(accept: string | null): boolean {
  if (!accept) return false
  const q = (type: string): number => {
    for (const part of accept.split(",")) {
      const [mediaType = "", ...params] = part.trim().split(";")
      if (mediaType.trim().toLowerCase() !== type) continue
      const value = params.map((p) => p.trim()).find((p) => p.startsWith("q="))
      return value ? Number(value.slice(2)) || 0 : 1
    }
    return -1
  }
  const markdown = q("text/markdown")
  return markdown > 0 && markdown >= q("text/html")
}

type ResourceType =
  | "page"
  | "markdown"
  | "llms"
  | "catalog"
  | "image"
  | "font"
  | "stylesheet"
  | "data"
  | "sitemap"
  | "other"

/** What a served path is, and which asset it belongs to. */
export function describePath(path: string): {
  resourceType: ResourceType
  format?: string
  assetType?: string
  assetSlug?: string
} {
  const ext = /\.([a-z0-9]+)$/i.exec(path)?.[1]?.toLowerCase()
  const [, section = "", file = ""] = path.split("/")
  const stem = file.replace(/\.[^.]+$/, "")
  const assetType =
    section === "hoggies"
      ? "hoggie"
      : section === "crests"
        ? "crest"
        : section === "logo"
          ? "logo"
          : section === "fonts"
            ? "font"
            : undefined
  const asset = assetType && stem ? { assetType, assetSlug: stem } : {}
  if (!ext) return { resourceType: "page", ...asset }
  if (path === "/llms.txt" || path === "/llms-full.txt")
    return { resourceType: "llms", format: ext }
  if (path === "/catalog.json") return { resourceType: "catalog", format: ext }
  if (path === "/sitemap.xml") return { resourceType: "sitemap", format: ext }
  const resourceType: ResourceType =
    ext === "md"
      ? "markdown"
      : ext === "svg" || ext === "png"
        ? "image"
        : ext === "woff2"
          ? "font"
          : ext === "css"
            ? "stylesheet"
            : ext === "json"
              ? "data"
              : "other"
  return { resourceType, format: ext, ...asset }
}

/** Response with the agent headers for the path it actually served. */
function withAgentHeaders(
  response: Response,
  served: string,
  requested: string,
  negotiated: boolean,
) {
  const res = new Response(response.body, response)
  const page = isPagePath(requested) && !negotiated
  if (page && response.ok) {
    res.headers.append(
      "Link",
      `<${SITE_URL}${markdownPathFor(requested)}>; rel="alternate"; type="text/markdown"`,
    )
  } else if (!page) {
    res.headers.set("Access-Control-Allow-Origin", "*")
  }
  if (served.endsWith(".md")) {
    res.headers.set("Content-Type", "text/markdown; charset=utf-8")
    res.headers.set("Link", `<${SITE_URL}${pagePathFor(served)}>; rel="canonical"`)
  }
  // A page's representation depends on `Accept` (HTML or its markdown twin).
  if (isPagePath(requested)) res.headers.append("Vary", "Accept")
  return res
}

/** Daily-rotating anonymous id: counts distinct clients per day without storing an IP. */
async function anonymousId(request: Request): Promise<string> {
  const day = new Date().toISOString().slice(0, 10)
  const ip = request.headers.get("CF-Connecting-IP") ?? ""
  const ua = request.headers.get("User-Agent") ?? ""
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${day}|${ip}|${ua}`),
  )
  return Array.from(new Uint8Array(digest).slice(0, 16), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("")
}

async function capture(
  request: PagesContext["request"],
  served: string,
  status: number,
  negotiated: boolean,
) {
  const url = new URL(request.url)
  const userAgent = request.headers.get("User-Agent")
  const agent = classifyUserAgent(userAgent)
  const described = describePath(served)
  // Browsers' page views are posthog-js's job; everything else is what this is for.
  if (described.resourceType === "page" && agent.category === "browser") return

  await fetch(POSTHOG_CAPTURE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: POSTHOG_KEY,
      event: "brand resource fetched",
      distinct_id: await anonymousId(request),
      timestamp: new Date().toISOString(),
      properties: {
        path: url.pathname,
        served_path: served,
        resource_type: described.resourceType,
        format: described.format,
        asset_type: described.assetType,
        asset_slug: described.assetSlug,
        markdown_negotiated: negotiated,
        status,
        agent_name: agent.name,
        agent_operator: agent.operator,
        agent_category: agent.category,
        is_bot: agent.category !== "browser",
        accept: request.headers.get("Accept") ?? undefined,
        country: request.cf?.country,
        $raw_user_agent: userAgent ?? undefined,
        $referrer: request.headers.get("Referer") ?? undefined,
        $current_url: url.href,
        $host: url.host,
        $pathname: url.pathname,
        $lib: "brand-pages-middleware",
        $process_person_profile: false,
        // The request reaches PostHog from Cloudflare, so its IP would geolocate Cloudflare.
        $geoip_disable: true,
      },
    }),
  })
}

export async function onRequest(context: PagesContext): Promise<Response> {
  const { request } = context
  const url = new URL(request.url)
  const isGet = request.method === "GET" || request.method === "HEAD"

  let served = url.pathname
  let negotiated = false
  let response: Response | undefined
  if (isGet && isPagePath(url.pathname) && prefersMarkdown(request.headers.get("Accept"))) {
    try {
      const markdownPath = markdownPathFor(url.pathname)
      const markdown = await context.env.ASSETS.fetch(new URL(markdownPath, url))
      if (markdown.ok) {
        response = markdown
        served = markdownPath
        negotiated = true
      }
    } catch {
      // Fall through to the HTML.
    }
  }
  response ??= await context.next()

  if (request.method === "GET") {
    context.waitUntil(capture(request, served, response.status, negotiated).catch(() => undefined))
  }

  try {
    return withAgentHeaders(response, served, url.pathname, negotiated)
  } catch {
    return response
  }
}
