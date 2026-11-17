import { Logo } from "@posthog/brand/logo"
import { lazy, type ReactNode, Suspense, useEffect } from "react"
import { Link, NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom"
import { assetFilePath, markdownPath } from "./agent-paths.ts"
import { BADGE_ALT, BADGE_SIZE, BADGES } from "./badge-files.ts"
import { ErrorBoundary } from "./components/ErrorBoundary.tsx"
import { NavMenu } from "./components/NavMenu.tsx"
import { MAKER_CATALOG } from "./image-maker/catalog.ts"
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
const loadBadgesPage = () => import("./pages/Badges.tsx")
const loadImageMakersPage = () => import("./pages/ImageMakers.tsx")
const loadImageMakerPage = () => import("./pages/ImageMaker.tsx")

const LogoPage = lazy(() => loadLogoPage().then((m) => ({ default: m.LogoPage })))
const FontsPage = lazy(() => loadFontsPage().then((m) => ({ default: m.FontsPage })))
const ColorsPage = lazy(() => loadColorsPage().then((m) => ({ default: m.ColorsPage })))
const HoggiesPage = lazy(() => loadHoggiesPage().then((m) => ({ default: m.HoggiesPage })))
const CrestsPage = lazy(() => loadCrestsPage().then((m) => ({ default: m.CrestsPage })))
const BadgesPage = lazy(() => loadBadgesPage().then((m) => ({ default: m.BadgesPage })))
const ImageMakersPage = lazy(() =>
  loadImageMakersPage().then((m) => ({ default: m.ImageMakersPage })),
)
const ImageMakerPage = lazy(() => loadImageMakerPage().then((m) => ({ default: m.ImageMakerPage })))
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
  /** Only active on exactly this path, not on the pages under it. */
  end?: boolean
  /** A line under the label, in a group's panel. */
  description?: string
  /** Indented under the item before it, in a group's panel. */
  nested?: boolean
  /** Chunk to warm when the link is hovered or focused. Overview ships in the initial bundle. */
  load?: () => Promise<unknown>
}

interface NavGroup {
  label: string
  items: NavItem[]
}

// The assets people come for lead (the logo, then the hoggies), then the rest of the brand kit
// in one group, then the tools. The brand mark already links home, so there's no "Overview" item.
const NAV: (NavItem | NavGroup)[] = [
  { to: "/logo", label: "Logo", load: loadLogoPage },
  { to: "/hoggies", label: "Hoggies", load: loadHoggiesPage },
  {
    label: "Brand kit",
    items: [
      {
        to: "/crests",
        label: "Crests",
        description: "A crest for every team, full size and mini",
        load: loadCrestsPage,
      },
      {
        to: "/colors",
        label: "Colors",
        description: "The palette, as tokens and CSS variables",
        load: loadColorsPage,
      },
      {
        to: "/fonts",
        label: "Fonts",
        description: "RoundHog, the brand typeface",
        load: loadFontsPage,
      },
    ],
  },
  {
    label: "Tools",
    items: [
      {
        to: "/tools/images",
        end: true,
        label: "Image makers",
        description: "Blog, event and social images, made in the browser",
        load: loadImageMakersPage,
      },
      ...MAKER_CATALOG.map((maker) => ({
        to: `/tools/images/${maker.slug}`,
        label: maker.name,
        nested: true,
        load: loadImageMakerPage,
      })),
      {
        to: "/badges",
        label: "Website badges",
        description: "A “Built with PostHog” badge for your site",
        load: loadBadgesPage,
      },
    ],
  },
]

const isGroup = (entry: NavItem | NavGroup): entry is NavGroup => "items" in entry

const isUnder = (page: string, to: string) => page === to || page.startsWith(`${to}/`)

// A maker's editor fills the window instead of scrolling (theme.css `.app-fit`), and has no footer.
const MAKER_PATHS = new Set(MAKER_CATALOG.map((maker) => `/tools/images/${maker.slug}`))

function NavItemLink({ item }: { item: NavItem }) {
  const { load } = item
  const prefetch = load ? () => prefetchRoute(load) : undefined
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        [item.nested && "nested", isActive && "active"].filter(Boolean).join(" ") || undefined
      }
      // Start the chunk on intent rather than on click, so by the time the
      // navigation transition runs there is usually nothing left to wait for.
      onMouseEnter={prefetch}
      onFocus={prefetch}
    >
      {item.description ? (
        <>
          <span className="nav-item-label">{item.label}</span>
          <span className="nav-item-desc">{item.description}</span>
        </>
      ) : (
        item.label
      )}
    </NavLink>
  )
}

function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const page = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname
  const maker = MAKER_PATHS.has(page)
  return (
    <div className={maker ? "app app-fit" : "app"}>
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
            {NAV.map((entry) =>
              isGroup(entry) ? (
                <NavMenu
                  key={entry.label}
                  label={entry.label}
                  active={entry.items.some((item) => isUnder(page, item.to))}
                  onWarm={() => {
                    for (const load of new Set(entry.items.map((item) => item.load))) {
                      if (load) prefetchRoute(load)
                    }
                  }}
                >
                  {entry.items.map((item) => (
                    <NavItemLink key={item.to} item={item} />
                  ))}
                </NavMenu>
              ) : (
                <NavItemLink key={entry.to} item={entry} />
              ),
            )}
          </div>
          <div className="nav-actions">
            <a className="btn btn-primary btn-sm" href={NPM_URL}>
              Install
            </a>
          </div>
        </nav>
      </header>
      {/* A maker's three-column editor needs a wider panel than the reading pages. */}
      <main className={maker ? "page page-wide" : "page"}>{children}</main>
      {/* An editor is a workspace, not a page to read to the end, so it goes without. */}
      {maker ? null : <Footer page={page} />}
    </div>
  )
}

function Footer({ page }: { page: string }) {
  return (
    <footer className="footer">
      <p className="footer-text">
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
      </p>
      {/* Our own badge, dogfooding the embed: it links to the Badges page rather than
            posthog.com, since everyone here already knows where PostHog lives. */}
      <Link
        to="/badges"
        className="footer-badge"
        onMouseEnter={() => prefetchRoute(loadBadgesPage)}
        onFocus={() => prefetchRoute(loadBadgesPage)}
      >
        <img
          src={assetFilePath({ type: "badge", slug: BADGES[0].id }, "svg")}
          alt={BADGE_ALT}
          width={BADGE_SIZE.width}
          height={BADGE_SIZE.height}
        />
        <span>Get a badge for your site</span>
      </Link>
    </footer>
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
            <Route path="/badges" element={<BadgesPage />} />
            <Route path="/tools/images" element={<ImageMakersPage />} />
            <Route path="/tools/images/:slug" element={<ImageMakerPage />} />
            <Route path="/crests/:slug" element={<CrestDetailPage />} />
            <Route path="/hoggies/:slug" element={<HoggieDetailPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ErrorBoundary>
      </Suspense>
    </Layout>
  )
}
