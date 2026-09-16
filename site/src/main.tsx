import { colorsCss } from "@posthog/brand/colors/css"
import { roundHogFontFaceCss } from "@posthog/brand/fonts/css"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { App } from "./App.tsx"
import { isPrefetching } from "./prefetch.ts"
import "./theme.css"

// Inject the package's own brand assets so the site's chrome is rendered from the same
// things it documents — one more live demo, and an integration test of these exports:
//   • the brand-color custom properties (`--posthog-blue`, …), and
//   • RoundHog's `@font-face` rules, so the whole site is set in the brand typeface
//     (theme.css picks it up via the `--font-brand` stack on <body>).
const brandStyles = document.createElement("style")
brandStyles.textContent = `${colorsCss}\n${roundHogFontFaceCss}`
document.head.appendChild(brandStyles)

// Vite fires `vite:preloadError` when a lazy route's chunk can't be fetched, almost
// always because a new deploy replaced the hashed filenames this tab's `index.html` points
// at. Reloading picks up the new manifest. Guarded by a sessionStorage stamp so a chunk
// that is genuinely gone can't put the tab in a reload loop; after one attempt the error
// falls through to the ErrorBoundary's reload prompt instead.
const RELOAD_STAMP = "brand-site:stale-chunk-reload"
window.addEventListener("vite:preloadError", (event) => {
  // A speculative nav-link prefetch that missed is not worth reloading the tab over — the
  // user only hovered a link, and the real navigation will still surface the problem.
  if (isPrefetching()) {
    return
  }
  const last = Number(sessionStorage.getItem(RELOAD_STAMP) ?? 0)
  if (Date.now() - last < 30_000) {
    return
  }
  event.preventDefault() // Otherwise Vite rethrows and the boundary flashes before we reload.
  sessionStorage.setItem(RELOAD_STAMP, String(Date.now()))
  window.location.reload()
})

// The built HTML ships a static, crawler-readable copy of the page inside #root (see
// seo-plugin.ts). React replaces the container's contents on its first render anyway, but
// clearing it explicitly keeps that contract visible from this side of the boundary.
const container = document.getElementById("root")!
container.replaceChildren()

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
