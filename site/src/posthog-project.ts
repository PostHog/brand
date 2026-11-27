// The PostHog project the site and its server side (edge/: the MCP server at /mcp) report to:
// posthog.com's. Plain constants with no imports, so the edge code can share them without pulling
// in posthog-js.

/** posthog.com's project. A public, write-only token: safe to ship in the bundle. */
export const POSTHOG_KEY = "sTMFPsFhdP1Ssg"
export const POSTHOG_HOST = "https://us.i.posthog.com"
