import { Logo } from "@posthog/brand/logo"
import { lazy, type ReactNode, Suspense, useEffect } from "react"
import { NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom"
import { markdownPath } from "./agent-paths.ts"
import { ErrorBoundary } from "./components/ErrorBoundary.tsx"
import { OverviewPage } from "./pages/Overview.tsx"
import { prefetchRoute } from "./prefetch.ts"
import { formatReleaseDate, release, releaseUrl } from "./release.ts"
import { setWebMcpNavigate } from "./webmcp.ts"
import origamiGardenWebp from "./assets/origami-garden.webp"

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
const HoggieDetailPage = lazy(() =>
  import("./pages/HoggieDetail.tsx").then((m) => ({ default: m.HoggieDetailPage })),
)

// Lazy for the same reason: its hog is a full inline-SVG illustration, and hardly anyone
// lands on a 404.
const NotFoundPage = lazy(() =>
  import("./pages/NotFound.tsx").then((m) => ({ default: m.NotFoundPage })),
)

const REPO_URL = "https://github.com/PostHog/brand"
const NPM_URL = "https://www.npmjs.com/package/@posthog/brand"

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
  { to: "/crests", label: "Crests", end: false, load: loadCrestsPage },
  { to: "/hoggies", label: "Hoggies", end: false, load: loadHoggiesPage },
]

function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const page = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname
  return (
    <>
      {/* The "desktop" behind the frosted chrome: posthog.com's default keyboard-garden
          wallpaper, origami hogs tending the PostHog keys, blurred through the nav and panel. */}
      <div className="wallpaper" aria-hidden="true">
        <img className="wallpaper-hog" src={origamiGardenWebp} alt="" decoding="async" />
      </div>
      <header className="taskbar-wrap">
        <nav className="taskbar">
          <NavLink to="/" className="nav-brand" aria-label="PostHog Brand home">
            <Logo size={104} title="PostHog Brand" />
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
          <div className="nav-actions">
            <a className="nav-link-plain" href={REPO_URL}>
              GitHub
            </a>
            <a className="btn btn-primary btn-sm" href={NPM_URL}>
              Install
            </a>
          </div>
        </nav>
      </header>
      <main className="page">{children}</main>
      <footer className="footer">
        Every asset on this site comes from the{" "}
        <a href={REPO_URL}>
          <code>@posthog/brand</code>
        </a>{" "}
        package, at <a href={releaseUrl(release.version)}>v{release.version}</a> (released{" "}
        {formatReleaseDate(release.date)}).
        <br />
        For agents: <a href="/llms.txt">llms.txt</a> ·{" "}
        <a href={markdownPath(page)}>This page as markdown</a> ·{" "}
        <a href="/catalog.json">catalog.json</a>. Each asset is also a static <code>.svg</code> and{" "}
        <code>.png</code> file.
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
  const navigate = useNavigate()
  useEffect(() => setWebMcpNavigate((path) => navigate(path)), [navigate])

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
            <Route path="/hoggies/:slug" element={<HoggieDetailPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ErrorBoundary>
      </Suspense>
    </Layout>
  )
}
