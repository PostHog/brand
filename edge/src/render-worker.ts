// The image render Worker: draws image maker images on the server, for agents that can't run the
// makers in a browser. It opens the site's render page (site/render.html → site/src/render.ts) in a
// Browser Run headless browser and calls the makers' own code there, so a rendered PNG is the file
// the maker downloads rather than a re-implementation of it.
//
//   GET  /render/<maker>.png?image=<saved image>[&scale=2][&size=X]   the PNG (cached)
//   POST /make  { maker, request, size? }                             a make_*_image result (JSON)
//
// Reached through the brand site: functions/render/[file].ts forwards /render/* here, and the MCP
// server (edge/src/mcp.ts) calls /make. Both through the RENDER service binding; the Worker has no
// public URL of its own (wrangler.jsonc: workers_dev false, no routes).
//
// Guarding a public renderer: the browser session may only reach the site and the hosts pictures
// come from (`guardrails`, fixed for the session's life), saved images are size-capped, renders
// are cached by URL, and uncached work is rate limited per client IP.

import puppeteer, { type Browser } from "@cloudflare/puppeteer"
import { MAKER_CATALOG, type MakerSlug } from "../../site/src/image-maker/catalog.ts"

export interface RenderEnv {
  /** Browser Run. */
  BROWSER: Parameters<typeof puppeteer.launch>[0]
  /** Where the render page is served: https://brand.posthog.com (or the local dev server). */
  SITE_ORIGIN: string
  /** Other hosts a picture in an image may come from, comma-separated. */
  PICTURE_HOSTS?: string
  /** Workers rate limiting, keyed by client IP. Optional so local runs work without it. */
  RENDER_LIMIT?: { limit: (options: { key: string }) => Promise<{ success: boolean }> }
}

interface Ctx {
  waitUntil: (promise: Promise<unknown>) => void
}

const MAKERS = MAKER_CATALOG.map((maker) => maker.slug) as readonly string[]

/** The longest saved image the renderer takes: real ones are well under 2 KB. */
const MAX_IMAGE_PARAM = 16_000
/** How long a rendered PNG is cached: an image's drawing only changes with a deploy. */
const CACHE_SECONDS = 60 * 60 * 24
/** An idle browser session stays up this long for the next request (Browser Run's max is 10 min). */
const KEEP_ALIVE_MS = 60_000
/** A render that takes longer than this has stalled. */
const RENDER_TIMEOUT_MS = 25_000

function error(status: number, message: string): Response {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } })
}

function allowedDomains(env: RenderEnv): string[] {
  const hosts = (env.PICTURE_HOSTS ?? "")
    .split(",")
    .map((host) => host.trim())
    .filter(Boolean)
  return [new URL(env.SITE_ORIGIN).hostname, ...hosts]
}

/**
 * The first picture URL in an image's settings (any string value, at any depth) from a host the
 * renderer doesn't load from, or null. Paths on the site and `data:` images are fine. The session
 * guardrails block other hosts too; this says why up front (and holds where guardrails don't, in
 * local runs).
 */
export function disallowedPicture(value: unknown, allowed: readonly string[]): string | null {
  if (typeof value === "string") {
    if (!/^https?:\/\//i.test(value)) return null
    try {
      return allowed.includes(new URL(value).hostname) ? null : value
    } catch {
      return value
    }
  }
  if (value && typeof value === "object")
    for (const v of Object.values(value)) {
      const bad = disallowedPicture(v, allowed)
      if (bad) return bad
    }
  return null
}

function savedImage(param: string): unknown {
  try {
    const bin = atob(param.replace(/-/g, "+").replace(/_/g, "/"))
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))))
  } catch {
    return null
  }
}

function pictureError(url: string, env: RenderEnv): Response {
  return error(
    422,
    `The renderer doesn't load pictures from ${new URL(url).hostname}. Use a picture from ${allowedDomains(env).join(", ")}, a path on the site, or a data:image URL.`,
  )
}

/** A free browser session to reuse, or a new one (closed by Browser Run after KEEP_ALIVE_MS idle). */
async function browserFor(env: RenderEnv): Promise<Browser> {
  try {
    const sessions = await puppeteer.sessions(env.BROWSER)
    const free = sessions.find((session) => !session.connectionId)
    if (free) return await puppeteer.connect(env.BROWSER, free.sessionId)
  } catch {
    // The session was taken or closed meanwhile: start a new one.
  }
  return puppeteer.launch(env.BROWSER, {
    keep_alive: KEEP_ALIVE_MS,
    guardrails: { allowedDomains: allowedDomains(env) },
  })
}

/** Runs `brandRender.<fn>(...args)` on the render page, in a reused browser session. */
async function onRenderPage<T>(env: RenderEnv, fn: "png" | "make", args: unknown[]): Promise<T> {
  const browser = await browserFor(env)
  const page = await browser.newPage()
  try {
    const work = (async () => {
      // /render: Pages serves render.html there (and 308s /render.html to it).
      await page.goto(`${env.SITE_ORIGIN}/render`, { waitUntil: "load" })
      await page.waitForFunction(() => "brandRender" in window, { timeout: 10_000 })
      return (await page.evaluate(
        (name, rest) =>
          // oxlint-disable-next-line typescript/no-explicit-any -- the page's own API, typed there
          (window as any).brandRender[name](...rest),
        fn,
        args,
      )) as T
    })()
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("The render timed out.")), RENDER_TIMEOUT_MS),
    )
    return await Promise.race([work, timeout])
  } finally {
    await page.close().catch(() => undefined)
    // Leave the session running for the next request instead of closing it.
    browser.disconnect()
  }
}

/** The page's thrown error, without puppeteer's wrapping. */
function reason(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err)
  return message.replace(/^Error: /, "").split("\n")[0]!
}

async function limited(request: Request, env: RenderEnv): Promise<boolean> {
  if (!env.RENDER_LIMIT) return false
  const key = request.headers.get("cf-connecting-ip") ?? "unknown"
  const { success } = await env.RENDER_LIMIT.limit({ key })
  return !success
}

async function renderPng(request: Request, env: RenderEnv, ctx: Ctx): Promise<Response> {
  const url = new URL(request.url)
  const maker = /^\/render\/([a-z-]+)\.png$/.exec(url.pathname)?.[1]
  if (!maker || !MAKERS.includes(maker))
    return error(404, `No image maker there. Makers: ${MAKERS.join(", ")}.`)
  const image = url.searchParams.get("image")
  if (!image) return error(400, "Pass the saved image as ?image= (an image maker link's value).")
  if (image.length > MAX_IMAGE_PARAM) return error(413, "That saved image is too large.")
  const saved = savedImage(image)
  if (!saved) return error(400, "The image parameter isn't a saved image (base64url JSON).")
  const blocked = disallowedPicture(saved, allowedDomains(env))
  if (blocked) return pictureError(blocked, env)
  const scale = url.searchParams.get("scale") === "2" ? 2 : 1
  const size = url.searchParams.get("size") ?? undefined

  // One cache entry per normalized URL (the parameters that change the image, in one order).
  const key = new URL(url.origin + url.pathname)
  key.searchParams.set("image", image)
  if (scale === 2) key.searchParams.set("scale", "2")
  if (size) key.searchParams.set("size", size)
  const cache = (caches as unknown as { default: Cache }).default
  const hit = await cache.match(key.toString())
  if (hit) return hit

  if (await limited(request, env)) return error(429, "Too many renders. Try again in a minute.")
  let rendered: { png: string; filename: string }
  try {
    rendered = await onRenderPage(env, "png", [maker as MakerSlug, image, { scale, size }])
  } catch (err) {
    return error(422, reason(err))
  }
  const bytes = Uint8Array.from(atob(rendered.png), (c) => c.charCodeAt(0))
  const response = new Response(bytes, {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `inline; filename="${rendered.filename}"`,
      "Cache-Control": `public, max-age=${CACHE_SECONDS}`,
      "Access-Control-Allow-Origin": "*",
    },
  })
  ctx.waitUntil(cache.put(key.toString(), response.clone()))
  return response
}

async function make(request: Request, env: RenderEnv): Promise<Response> {
  let body: { maker?: string; request?: Record<string, unknown>; size?: string }
  try {
    body = await request.json()
  } catch {
    return error(400, "Send JSON: { maker, request }.")
  }
  if (!body.maker || !MAKERS.includes(body.maker))
    return error(404, `No image maker "${body.maker}".`)
  if (JSON.stringify(body.request ?? {}).length > MAX_IMAGE_PARAM)
    return error(413, "That request is too large.")
  const blocked = disallowedPicture(body.request, allowedDomains(env))
  if (blocked) return pictureError(blocked, env)
  if (await limited(request, env)) return error(429, "Too many images. Try again in a minute.")
  try {
    const result = await onRenderPage<Record<string, unknown>>(env, "make", [
      body.maker,
      body.request ?? {},
      { size: body.size },
    ])
    return Response.json(result)
  } catch (err) {
    return error(422, reason(err))
  }
}

export default {
  async fetch(request: Request, env: RenderEnv, ctx: Ctx): Promise<Response> {
    const { pathname } = new URL(request.url)
    if (request.method === "GET" && pathname.startsWith("/render/"))
      return renderPng(request, env, ctx)
    if (request.method === "POST" && pathname === "/make") return make(request, env)
    return error(404, "Not found.")
  },
}
