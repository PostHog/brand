// The /mcp route on Cloudflare Pages: brand.posthog.com's remote MCP server. The server lives in
// edge/src/mcp.ts; this file only routes to it (Pages turns every file under functions/ into a
// route, so shared code stays out of here).

import { type Ctx, type Env, handleMcp } from "../edge/src/mcp.ts"

export const onRequest = (context: Ctx & { request: Request; env: Env }): Promise<Response> =>
  handleMcp(context.request, context.env, context)
