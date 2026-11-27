// /tools/images/<maker>.png?image=… on Cloudflare Pages: a saved image (the maker link's `?image=`)
// exported as the PNG its maker downloads, so the PNG's URL is the maker's link plus `.png`. The
// work happens in the image makers Worker (edge/src/image-makers-worker.ts), reached through the
// Pages project's IMAGE_MAKERS service binding. Everything else under /tools/images/ (the maker
// pages and their markdown twins) goes on to the static files untouched.

interface Env {
  IMAGE_MAKERS?: { fetch: (request: Request) => Promise<Response> }
}

interface Context {
  request: Request
  env: Env
  params: { file?: string | string[] }
  next: () => Promise<Response>
}

export const onRequest = ({ request, env, params, next }: Context): Promise<Response> => {
  const file = Array.isArray(params.file) ? params.file.join("/") : (params.file ?? "")
  if (!file.endsWith(".png")) return next()
  if (env.IMAGE_MAKERS) return env.IMAGE_MAKERS.fetch(request)
  return Promise.resolve(
    Response.json(
      { error: "Image export isn't set up on this deployment (no IMAGE_MAKERS binding)." },
      { status: 503 },
    ),
  )
}
