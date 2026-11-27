// The render page (/render.html): what the image render Worker (edge/src/render-worker.ts) opens
// in a headless browser to draw images on the server, with the image makers' own code — so a
// rendered PNG is the file the maker downloads, not a re-implementation of it. No React, no
// analytics: it registers RoundHog the way the site does (main.tsx) and exposes two calls on
// `window.brandRender` for the Worker to evaluate.

import { roundHogFontFaceCss } from "@posthog/brand/fonts/css"
import { makeImage, renderImage } from "./image-maker/agent.ts"
import type { MakerSlug } from "./image-maker/catalog.ts"
import type { Request } from "./image-maker/editor/request.ts"

const style = document.createElement("style")
style.textContent = roundHogFontFaceCss
document.head.appendChild(style)

const brandRender = {
  /** A saved image (`?image=` value) as its maker's PNG. */
  png: (maker: MakerSlug, image: string, opts: { scale?: 1 | 2; size?: string } = {}) =>
    renderImage(maker, image, opts),
  /** A new image from a make_*_image request: the preview, link, decisions and warnings. */
  make: (maker: MakerSlug, request: Request, opts: { size?: string } = {}) =>
    makeImage(maker, request, opts),
}

declare global {
  interface Window {
    brandRender: typeof brandRender
  }
}

window.brandRender = brandRender
