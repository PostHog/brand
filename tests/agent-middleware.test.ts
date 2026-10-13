import { afterEach, describe, expect, it, vi } from "vitest"
import {
  classifyUserAgent,
  describePath,
  markdownPathFor,
  onRequest,
  prefersMarkdown,
} from "../functions/_middleware.ts"

// The brand site's Pages middleware (functions/_middleware.ts): its pure helpers decide what
// gets captured as `brand resource fetched` and when a page is answered with its markdown.

describe("classifyUserAgent", () => {
  it("recognizes AI crawlers, assistants and search bots by product token", () => {
    expect(
      classifyUserAgent(
        "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
      ),
    ).toEqual({ name: "ClaudeBot", operator: "Anthropic", category: "ai_crawler" })
    expect(
      classifyUserAgent("Mozilla/5.0 (compatible; ChatGPT-User/1.0; +https://openai.com/bot)"),
    ).toMatchObject({ name: "ChatGPT-User", category: "ai_assistant" })
    expect(classifyUserAgent("Mozilla/5.0 (compatible; OAI-SearchBot/1.0)")).toMatchObject({
      name: "OAI-SearchBot",
      category: "ai_search",
    })
    expect(
      classifyUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"),
    ).toMatchObject({ name: "Googlebot", category: "search_crawler" })
  })

  it("tells scripts and link previews from browsers", () => {
    expect(classifyUserAgent("curl/8.7.1")).toEqual({ name: "curl", category: "http_client" })
    expect(classifyUserAgent("python-httpx/0.27.0")).toMatchObject({ category: "http_client" })
    expect(
      classifyUserAgent("Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)"),
    ).toMatchObject({ category: "social_preview" })
    expect(
      classifyUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
      ),
    ).toEqual({ name: "browser", category: "browser" })
  })

  it("treats a missing user agent as a script, and unknown bots as bots", () => {
    expect(classifyUserAgent(null)).toEqual({ name: "unknown", category: "http_client" })
    expect(classifyUserAgent("Mozilla/5.0 (compatible; SomeNewCrawler/1.0)")).toMatchObject({
      category: "other_bot",
    })
  })
})

describe("prefersMarkdown", () => {
  it("serves markdown only when asked for it at least as strongly as HTML", () => {
    expect(prefersMarkdown("text/markdown")).toBe(true)
    expect(prefersMarkdown("text/markdown, text/html;q=0.9")).toBe(true)
    expect(prefersMarkdown("text/html, text/markdown;q=0.5")).toBe(false)
    expect(prefersMarkdown("text/html,application/xhtml+xml,*/*;q=0.8")).toBe(false)
    expect(prefersMarkdown("*/*")).toBe(false)
    expect(prefersMarkdown(null)).toBe(false)
  })
})

describe("paths", () => {
  it("maps a page to its markdown twin", () => {
    expect(markdownPathFor("/")).toBe("/index.md")
    expect(markdownPathFor("/hoggies/chart")).toBe("/hoggies/chart.md")
    expect(markdownPathFor("/logo/")).toBe("/logo.md")
  })

  it("describes what a path is and which asset it belongs to", () => {
    expect(describePath("/hoggies/noir-5.svg")).toEqual({
      resourceType: "image",
      format: "svg",
      assetType: "hoggie",
      assetSlug: "noir-5",
    })
    expect(describePath("/crests/marketing-mini.png")).toMatchObject({
      assetType: "crest",
      assetSlug: "marketing-mini",
    })
    expect(describePath("/crests/marketing")).toMatchObject({
      resourceType: "page",
      assetSlug: "marketing",
    })
    expect(describePath("/llms-full.txt")).toEqual({ resourceType: "llms", format: "txt" })
    expect(describePath("/logo.md")).toEqual({ resourceType: "markdown", format: "md" })
    expect(describePath("/catalog.json")).toEqual({ resourceType: "catalog", format: "json" })
  })
})

describe("onRequest", () => {
  const BROWSER =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"

  /** Runs the middleware against fake static assets; returns the response and captured events. */
  async function run(path: string, headers: Record<string, string>) {
    const captured: Record<string, unknown>[] = []
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        captured.push(JSON.parse(String(init.body)))
        return new Response("{}")
      }),
    )
    const assets = vi.fn(async (input: Request | URL | string) => {
      const url = new URL(input instanceof Request ? input.url : input)
      return url.pathname.endsWith(".md")
        ? new Response("# Chart", { headers: { "Content-Type": "text/plain" } })
        : new Response("not found", { status: 404 })
    })
    const pending: Promise<unknown>[] = []
    const response = await onRequest({
      request: new Request(`https://brand.posthog.com${path}`, { headers }),
      next: async () =>
        new Response(path.endsWith(".svg") ? "<svg/>" : "<html></html>", {
          headers: { "Content-Type": path.endsWith(".svg") ? "image/svg+xml" : "text/html" },
        }),
      env: { ASSETS: { fetch: assets } },
      waitUntil: (promise) => pending.push(promise),
    })
    await Promise.all(pending)
    return { response, captured, assets }
  }

  afterEach(() => vi.unstubAllGlobals())

  it("answers a page with its markdown twin when asked for markdown, and captures it", async () => {
    const { response, captured, assets } = await run("/hoggies/chart", {
      Accept: "text/markdown",
      "User-Agent": "Claude-User/1.0",
    })
    expect(String(assets.mock.calls[0]?.[0])).toBe("https://brand.posthog.com/hoggies/chart.md")
    expect(await response.text()).toBe("# Chart")
    expect(response.headers.get("Content-Type")).toBe("text/markdown; charset=utf-8")
    expect(response.headers.get("Link")).toBe(
      '<https://brand.posthog.com/hoggies/chart>; rel="canonical"',
    )
    expect(response.headers.get("Vary")).toContain("Accept")
    expect(captured).toHaveLength(1)
    expect(captured[0]).toMatchObject({
      event: "brand resource fetched",
      properties: {
        path: "/hoggies/chart",
        served_path: "/hoggies/chart.md",
        resource_type: "markdown",
        markdown_negotiated: true,
        asset_type: "hoggie",
        asset_slug: "chart",
        agent_name: "Claude-User",
        agent_category: "ai_assistant",
        $process_person_profile: false,
      },
    })
  })

  it("leaves browser page views to posthog-js, but links them to their markdown", async () => {
    const { response, captured } = await run("/hoggies/chart", {
      Accept: "text/html,*/*;q=0.8",
      "User-Agent": BROWSER,
    })
    expect(await response.text()).toBe("<html></html>")
    expect(response.headers.get("Link")).toBe(
      '<https://brand.posthog.com/hoggies/chart.md>; rel="alternate"; type="text/markdown"',
    )
    expect(captured).toHaveLength(0)
  })

  it("captures direct file fetches, with CORS", async () => {
    const { response, captured } = await run("/hoggies/chart.svg", { "User-Agent": "curl/8.7.1" })
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*")
    expect(captured[0]).toMatchObject({
      properties: {
        resource_type: "image",
        format: "svg",
        asset_slug: "chart",
        agent_name: "curl",
      },
    })
  })

  it("still serves the file when PostHog is unreachable", async () => {
    vi.stubGlobal("fetch", () => Promise.reject(new Error("offline")))
    const pending: Promise<unknown>[] = []
    const response = await onRequest({
      request: new Request("https://brand.posthog.com/llms.txt", {
        headers: { "User-Agent": "curl/8" },
      }),
      next: async () => new Response("# PostHog Brand"),
      env: { ASSETS: { fetch: async () => new Response(null, { status: 404 }) } },
      waitUntil: (promise) => pending.push(promise),
    })
    await expect(Promise.all(pending)).resolves.toBeDefined()
    expect(await response.text()).toBe("# PostHog Brand")
  })
})
