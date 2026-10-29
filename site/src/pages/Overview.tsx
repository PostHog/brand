import { findAssets } from "@posthog/brand"
import { colors } from "@posthog/brand/colors"

// Direct named imports tree-shake to just these few assets, so the landing page stays
// light — the full-catalog barrels load lazily on the Hoggies / Crests routes.
import { GraphicsCrest } from "@posthog/brand/crests"
import { HedgehogMoney, HedgehogExplorer, HedgehogChart } from "@posthog/brand/hoggies"
import { Logo } from "@posthog/brand/logo"
import posthog from "posthog-js"
import { Link } from "react-router-dom"
import { assetFilePath } from "../agent-paths.ts"
import { BADGE_SIZE, BADGES } from "../badge-files.ts"
import { CodeBlock } from "../components/CodeBlock.tsx"
import { CopyButton } from "../components/CopyButton.tsx"
import { useSeo } from "../useSeo.ts"

const INSTALL = "pnpm add @posthog/brand"

const QUICK_START = `import { Logo } from "@posthog/brand/logo"
import { HedgehogChart } from "@posthog/brand/hoggies"
import { GraphicsCrest } from "@posthog/brand/crests"
import { colors } from "@posthog/brand/colors"

<Logo size={160} title="PostHog" />
<HedgehogChart size={96} />
<GraphicsCrest size={64} />        // full crest
<GraphicsCrest.Mini size={24} />   // mini badge

colors.blue.core                   // "#1490E8"`

const hoggieCount = findAssets({ namespace: "hoggies" }).length
const crestCount = findAssets({ namespace: "crests", tier: "full" }).length
const colorCount = Object.keys(colors).length

export function OverviewPage() {
  useSeo("/")

  return (
    <div>
      <section className="hero">
        <div>
          <h1>PostHog brand assets</h1>
          <p>
            Our logo, colors, fonts, hedgehogs, and team crests, packaged for React. Install{" "}
            <code>@posthog/brand</code> and everything works offline. Or self-serve them from here!
          </p>
          <div className="hero-actions">
            <Link to="/hoggies" className="btn btn-primary">
              Browse the hoggies
            </Link>
            <span className="install">
              {INSTALL}
              <CopyButton
                value={INSTALL}
                onCopied={() => posthog.capture("code copied", { snippet: "install" })}
              />
            </span>
          </div>
        </div>
        <div className="hero-art">
          <HedgehogExplorer title="A hedgehog explorer reading a map" />
        </div>
      </section>

      <section className="section">
        <h2>Quick start</h2>
        <CodeBlock slug="quick-start" code={QUICK_START} />
      </section>

      <section className="section">
        <h2>For AI agents</h2>
        <p className="section-lede">
          Point your agent at <a href="/llms.txt">brand.posthog.com/llms.txt</a>. In a JS or TS
          project it should install <code>@posthog/brand</code> and import what it needs. Anywhere
          else, it can download any asset as a static file, like{" "}
          <a href="/hoggies/chart.svg">/hoggies/chart.svg</a> or{" "}
          <a href="/logo/posthog-logo.png">/logo/posthog-logo.png</a>.
        </p>
        <p className="section-lede">
          Each page also comes as markdown (<a href="/index.md">/index.md</a>), and{" "}
          <a href="/catalog.json">/catalog.json</a> lists every asset. In browsers that support
          WebMCP, the site also registers tools to search, inspect, and download assets.
        </p>
      </section>

      <section className="section">
        <h2>Explore</h2>
        <div className="grid grid-cards">
          <Link to="/logo" className="card nav-card">
            <div className="nav-card-preview">
              <Logo layout="stacked" size={64} />
            </div>
            <h3>Logo</h3>
            <p>One &lt;Logo&gt; component for every lockup, in full color, print, or mono.</p>
          </Link>

          <Link to="/fonts" className="card nav-card">
            <div className="nav-card-preview" aria-hidden>
              <span style={{ fontWeight: 800, fontSize: 40, letterSpacing: "-0.02em" }}>Aa</span>
            </div>
            <h3>Fonts</h3>
            <p>RoundHog, our typeface. Eight woff2 faces ship with the package.</p>
          </Link>

          <Link to="/colors" className="card nav-card">
            <div className="nav-card-preview">
              {Object.values(colors)
                .slice(0, 6)
                .map((c) => (
                  <span
                    key={c.name}
                    style={{
                      width: 28,
                      height: 56,
                      borderRadius: 6,
                      background: `linear-gradient(180deg, ${c.gradient[0]}, ${c.gradient[1]})`,
                    }}
                  />
                ))}
            </div>
            <h3>Colors</h3>
            <p>
              {colorCount} brand colors with lighter and darker tones, gradients, and CSS variables.
            </p>
          </Link>

          <Link to="/hoggies" className="card nav-card">
            <div className="nav-card-preview">
              <HedgehogMoney size={64} />
              <HedgehogExplorer size={64} />
              <HedgehogChart size={64} />
            </div>
            <h3>Hoggies</h3>
            <p>{hoggieCount} hedgehog illustrations. Import only the ones you use.</p>
          </Link>

          <Link to="/crests" className="card nav-card">
            <div className="nav-card-preview">
              <GraphicsCrest size={70} />
              <GraphicsCrest.Mini size={40} />
            </div>
            <h3>Crests</h3>
            <p>{crestCount} team crests, each with a full illustration and a mini badge.</p>
          </Link>

          <Link to="/badges" className="card nav-card">
            <div className="nav-card-preview">
              {BADGES.map((badge) => (
                <img
                  key={badge.id}
                  src={assetFilePath({ type: "badge", slug: badge.id }, "svg")}
                  alt=""
                  width={BADGE_SIZE.width}
                  height={BADGE_SIZE.height}
                />
              ))}
            </div>
            <h3>Badges</h3>
            <p>A “Built with PostHog” badge for your site's footer or README.</p>
          </Link>
        </div>
      </section>
    </div>
  )
}
