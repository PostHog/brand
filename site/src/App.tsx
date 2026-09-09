import { Logo } from "@posthog/brand/logo"
import { lazy, type ReactNode, Suspense } from "react"
import { NavLink, Route, Routes, useLocation } from "react-router-dom"
import { ErrorBoundary } from "./components/ErrorBoundary.tsx"
import { OverviewPage } from "./pages/Overview.tsx"
import { prefetchRoute } from "./prefetch.ts"

// The asset-catalog pages each pull a large barrel of inline-SVG components, so they
// load as their own route chunks instead of bloating the initial bundle. The loaders are
// named so the nav can also reach for them on hover/focus (see `prefetchRoute`).
const loadLogoPage = () => import("./pages/Logo.tsx")
const loadFontsPage = () => import("./pages/Fonts.tsx")
const loadColorsPage = () => import("./pages/Colors.tsx")
const loadHoggiesPage = () => import("./pages/Hoggies.tsx")
const loadCrestsPage = () => import("./pages/Crests.tsx")

const LogoPage = lazy(() => loadLogoPage().then((m) => ({ default: m.LogoPage })))
const FontsPage = lazy(() => loadFontsPage().then((m) => ({ default: m.FontsPage })))
const ColorsPage = lazy(() => loadColorsPage().then((m) => ({ default: m.ColorsPage })))
const HoggiesPage = lazy(() => loadHoggiesPage().then((m) => ({ default: m.HoggiesPage })))
const CrestsPage = lazy(() => loadCrestsPage().then((m) => ({ default: m.CrestsPage })))
const CrestDetailPage = lazy(() =>
  import("./pages/CrestDetail.tsx").then((m) => ({ default: m.CrestDetailPage })),
)

// Lazy for the same reason: its hog is a full inline-SVG illustration, and hardly anyone
// lands on a 404.
const NotFoundPage = lazy(() =>
  import("./pages/NotFound.tsx").then((m) => ({ default: m.NotFoundPage })),
)

interface NavItem {
  to: string
  label: string
  end: boolean
  /** Chunk to warm when the link is hovered or focused. Overview ships in the initial bundle. */
  load?: () => Promise<unknown>
}

const NAV: NavItem[] = [
  { to: "/", label: "Overview", end: true },
  { to: "/logo", label: "Logo", end: false, load: loadLogoPage },
  { to: "/fonts", label: "Fonts", end: false, load: loadFontsPage },
  { to: "/colors", label: "Colors", end: false, load: loadColorsPage },
  { to: "/hoggies", label: "Hoggies", end: false, load: loadHoggiesPage },
  { to: "/crests", label: "Crests", end: false, load: loadCrestsPage },
]

function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="wip-banner" role="alert">
        <strong>🚧 Work in progress.</strong> This entire website is AI-generated, and the PostHog
        brand shown here is <strong>not finalized</strong> — everything is subject to change.
      </div>
      <nav className="nav">
        <div className="nav-inner">
          <NavLink to="/" className="nav-brand" aria-label="PostHog Brand — home">
            <Logo size={132} title="PostHog Brand" />
          </NavLink>
          <div className="nav-links">
            {NAV.map((item) => {
              const { load } = item
              const prefetch = load ? () => prefetchRoute(load) : undefined
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => (isActive ? "active" : undefined)}
                  // Start the chunk on intent rather than on click, so by the time the
                  // navigation transition runs there is usually nothing left to wait for.
                  onMouseEnter={prefetch}
                  onFocus={prefetch}
                >
                  {item.label}
                </NavLink>
              )
            })}
          </div>
        </div>
      </nav>
      <main className="page">{children}</main>
      <footer className="footer">
        <div className="footer-inner">
          Everything on this site is rendered live from the{" "}
          <a href="https://github.com/PostHog/hedgehogs">
            <code>@posthog/brand</code>
          </a>{" "}
          package — no screenshots, no CDN.
        </div>
      </footer>
    </>
  )
}

/**
 * Router + shared layout. Each route is one showcase page.
 *
 * The routes sit inside an {@link ErrorBoundary}, so a throw (most plausibly a lazy route
 * chunk that failed to download after a fresh deploy) shows a reload prompt instead of
 * unmounting the whole app to a blank page. Keying it on the pathname clears a caught
 * error as soon as you navigate somewhere else.
 *
 * `Suspense` sits *outside* that keyed boundary on purpose. React Router runs navigations
 * as transitions, so an already-committed Suspense boundary keeps the current page on
 * screen while the next route's chunk downloads — but only if the boundary itself survives
 * the navigation. Nested inside the keyed boundary it was remounted on every click, which
 * made it a brand-new boundary with nothing committed and forced the fallback to flash.
 * Out here it only ever shows on a cold load straight into a lazy route.
 */
export function App() {
  const { pathname } = useLocation()

  return (
    <Layout>
      <Suspense fallback={<p className="route-loading">Loading…</p>}>
        <ErrorBoundary key={pathname}>
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/logo" element={<LogoPage />} />
            <Route path="/fonts" element={<FontsPage />} />
            <Route path="/colors" element={<ColorsPage />} />
            <Route path="/hoggies" element={<HoggiesPage />} />
            <Route path="/crests" element={<CrestsPage />} />
            <Route path="/crests/:slug" element={<CrestDetailPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ErrorBoundary>
      </Suspense>
    </Layout>
  )
}
