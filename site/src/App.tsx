import { Logo } from "@posthog/brand/logo"
import { lazy, type ReactNode, Suspense } from "react"
import { NavLink, Route, Routes } from "react-router-dom"
import { OverviewPage } from "./pages/Overview.tsx"

// The asset-catalog pages each pull a large barrel of inline-SVG components, so they
// load as their own route chunks instead of bloating the initial bundle.
const LogoPage = lazy(() => import("./pages/Logo.tsx").then((m) => ({ default: m.LogoPage })))
const FontsPage = lazy(() => import("./pages/Fonts.tsx").then((m) => ({ default: m.FontsPage })))
const ColorsPage = lazy(() => import("./pages/Colors.tsx").then((m) => ({ default: m.ColorsPage })))
const HoggiesPage = lazy(() =>
  import("./pages/Hoggies.tsx").then((m) => ({ default: m.HoggiesPage })),
)
const CrestsPage = lazy(() => import("./pages/Crests.tsx").then((m) => ({ default: m.CrestsPage })))
const CrestDetailPage = lazy(() =>
  import("./pages/CrestDetail.tsx").then((m) => ({ default: m.CrestDetailPage })),
)

const NAV = [
  { to: "/", label: "Overview", end: true },
  { to: "/logo", label: "Logo", end: false },
  { to: "/fonts", label: "Fonts", end: false },
  { to: "/colors", label: "Colors", end: false },
  { to: "/hoggies", label: "Hoggies", end: false },
  { to: "/crests", label: "Crests", end: false },
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
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => (isActive ? "active" : undefined)}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
      <main className="page">
        <Suspense fallback={<p className="count">Loading…</p>}>{children}</Suspense>
      </main>
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

/** Router + shared layout. Each route is one showcase page. */
export function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/logo" element={<LogoPage />} />
        <Route path="/fonts" element={<FontsPage />} />
        <Route path="/colors" element={<ColorsPage />} />
        <Route path="/hoggies" element={<HoggiesPage />} />
        <Route path="/crests" element={<CrestsPage />} />
        <Route path="/crests/:slug" element={<CrestDetailPage />} />
      </Routes>
    </Layout>
  )
}
