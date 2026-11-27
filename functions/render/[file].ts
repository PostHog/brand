// /render/<maker>.png on Cloudflare Pages: a saved image drawn by its image maker on the server.
// The work happens in the image render Worker (edge/src/render-worker.ts), reached through the
// Pages project's RENDER service binding; without the binding, rendering isn't set up.

interface Env {
  RENDER?: { fetch: (request: Request) => Promise<Response> }
}

export const onRequest = ({ request, env }: { request: Request; env: Env }): Promise<Response> =>
  env.RENDER
    ? env.RENDER.fetch(request)
    : Promise.resolve(
        Response.json(
          { error: "Image rendering isn't set up on this deployment (no RENDER binding)." },
          { status: 503 },
        ),
      )
