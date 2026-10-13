// Product analytics for the site, through posthog-js — the same project as posthog.com.
//
// posthog-js is loaded with a dynamic import after first paint, so it stays out of the entry
// chunk. Until it lands, `track` queues; after, it captures directly. Pageviews (including
// client-side navigations), autocapture, and WebMCP tool calls (`$mcp_tool_call`, see
// webmcp.ts) come from the SDK itself; `track` covers what autocapture can't see well — what
// was copied or downloaded, and in which format.
//
// Off in dev, so local clicking around doesn't land in the real project.

import type { PostHog } from "posthog-js"

/** posthog.com's project. A public, write-only token: safe to ship in the bundle. */
const POSTHOG_KEY = "sTMFPsFhdP1Ssg"
const POSTHOG_HOST = "https://us.i.posthog.com"

/** An asset, as every copy/download event describes it. */
export interface AssetRef {
  type: "hoggie" | "crest" | "logo"
  /** The hoggie/crest slug, or the logo file id (e.g. `posthog-logo-stacked-white`). */
  slug: string
  /** A hoggie variant family member's key, e.g. "2". */
  variant?: string
  tier?: "full" | "mini"
}

export function assetProperties(asset: AssetRef): Record<string, string | undefined> {
  return {
    asset_type: asset.type,
    asset_slug: asset.slug,
    asset_variant: asset.variant,
    asset_tier: asset.tier,
  }
}

type Properties = Record<string, string | number | boolean | undefined>

let client: PostHog | undefined
const queue: [string, Properties][] = []

export function track(event: string, properties: Properties = {}): void {
  if (client) client.capture(event, properties)
  else if (import.meta.env.PROD) queue.push([event, properties])
}

/**
 * Loads and starts posthog-js; resolves once it's initialized (immediately in dev, where it's
 * off). WebMCP tools must be registered *after* this — posthog-js instruments tools by wrapping
 * `document.modelContext.registerTool` during init.
 */
export async function initAnalytics(): Promise<void> {
  if (!import.meta.env.PROD) return
  try {
    const { posthog } = await import("posthog-js")
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      defaults: "2026-08-30",
      person_profiles: "identified_only",
      // `$mcp_tool_call` for every WebMCP tool an agent calls, with the agent's stated intent
      // and its self-reported model.
      capture_webmcp: true,
      // Agents are users of this site. By default posthog-js drops every event from a bot-like
      // browser — including any automated one (`navigator.webdriver`), i.e. most browser
      // agents. Keep them, tagged `$browser_type: "bot"`, so they can be told apart.
      opt_out_useragent_filter: true,
      // This is posthog.com's project: its surveys, support widget and product tours are
      // meant for posthog.com, not for the brand site.
      disable_surveys: true,
      disable_conversations: true,
      disable_product_tours: true,
    })
    client = posthog
    for (const [event, properties] of queue.splice(0)) posthog.capture(event, properties)
  } catch {
    // Blocked by an ad blocker or offline: the site works the same without analytics.
  }
}
