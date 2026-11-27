// The headless image makers page (/image-makers-headless): the image makers without their editor,
// for the server. The image makers Worker (edge/src/image-makers-worker.ts) opens it in a headless
// browser and calls `window.brandImageMakers`, which runs the makers' own code — so an exported
// PNG is the file the maker downloads, not a re-implementation of it. No React, no analytics: it
// registers RoundHog the way the site does (main.tsx) and exposes two calls.

import { roundHogFontFaceCss } from "@posthog/brand/fonts/css"
import { exportPng, makeImage } from "./agent.ts"
import type { MakerSlug } from "./catalog.ts"
import type { Request } from "./editor/request.ts"

const style = document.createElement("style")
style.textContent = roundHogFontFaceCss
document.head.appendChild(style)

const brandImageMakers = {
  /** A saved image (`?image=` value) as the PNG its maker downloads. */
  png: (maker: MakerSlug, image: string, opts: { scale?: 1 | 2; size?: string } = {}) =>
    exportPng(maker, image, opts),
  /** A new image from a make_*_image request: the preview, link, decisions and warnings. */
  make: (maker: MakerSlug, request: Request, opts: { size?: string } = {}) =>
    makeImage(maker, request, opts),
}

declare global {
  interface Window {
    brandImageMakers: typeof brandImageMakers
  }
}

window.brandImageMakers = brandImageMakers
