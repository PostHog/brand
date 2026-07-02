import { colorsCss } from "@posthog/brand/colors/css"
import { roundHogFontFaceCss } from "@posthog/brand/fonts/css"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { App } from "./App.tsx"
import "./theme.css"

// Inject the package's own brand assets so the site's chrome is rendered from the same
// things it documents — one more live demo, and an integration test of these exports:
//   • the brand-color custom properties (`--posthog-blue`, …), and
//   • RoundHog's `@font-face` rules, so the whole site is set in the brand typeface
//     (theme.css picks it up via the `--font-brand` stack on <body>).
const brandStyles = document.createElement("style")
brandStyles.textContent = `${colorsCss}\n${roundHogFontFaceCss}`
document.head.appendChild(brandStyles)

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
