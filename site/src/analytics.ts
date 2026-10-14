// Product analytics for the site, through posthog-js — the same project as posthog.com.
//
// `initAnalytics` runs once in main.tsx before the first render; everything else imports
// `posthog` from posthog-js and calls `posthog.capture` directly. Pageviews (including
// client-side navigations), autocapture, and WebMCP tool calls (`$mcp_tool_call`, see
// webmcp.ts) come from the SDK itself; the custom events cover what autocapture can't see
// well — what was copied or downloaded, and in which format.

import posthog from "posthog-js"
import type { AssetRef } from "./agent-paths.ts"

/** posthog.com's project. A public, write-only token: safe to ship in the bundle. */
const POSTHOG_KEY = "sTMFPsFhdP1Ssg"
const POSTHOG_HOST = "https://us.i.posthog.com"

/** An asset's identity, as every copy/download event describes it. */
export function assetProperties(asset: AssetRef): Record<string, string | undefined> {
  return {
    asset_type: asset.type,
    asset_slug: asset.slug,
    asset_variant: asset.variant,
    asset_tier: asset.tier,
  }
}

/**
 * Starts posthog-js. WebMCP tools must be registered *after* this — posthog-js instruments
 * tools by wrapping `document.modelContext.registerTool` during init.
 */
export function initAnalytics(): void {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    defaults: "2026-08-30",
    person_profiles: "always",
    // Local clicking around stays out of the real project.
    opt_out_capturing_by_default: import.meta.env.DEV,
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
}
