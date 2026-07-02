import { findAssets } from "@posthog/brand"
import { colors } from "@posthog/brand/colors"
// Direct named imports tree-shake to just these few assets, so the landing page stays
// light — the full-catalog barrels load lazily on the Hoggies / Crests routes.
import { ArrayCrest } from "@posthog/brand/crests"
import { HedgehogAngel, HedgehogBallHog, HedgehogDoctorHog } from "@posthog/brand/hoggies"
import { Logo } from "@posthog/brand/logo"
import { Link } from "react-router-dom"
import { CodeBlock } from "../components/CodeBlock.tsx"

const QUICK_START = `import { Logo } from "@posthog/brand/logo"
import { HedgehogDoctorHog } from "@posthog/brand/hoggies"
import { ArrayCrest } from "@posthog/brand/crests"
import { colors } from "@posthog/brand/colors"

<Logo size={160} title="PostHog" />
<HedgehogDoctorHog size={96} />
<ArrayCrest size={64} />        {/* full crest */}
<ArrayCrest.Mini size={24} />  {/* mini badge */}
colors.blue.core               // "#1490E8"`

const hoggieCount = findAssets({ namespace: "hoggies" }).length
const crestCount = findAssets({ namespace: "crests", tier: "full" }).length
const colorCount = Object.keys(colors).length

export function OverviewPage() {
  return (
    <div>
      <section className="hero">
        <div className="hero-logo">
          <Logo size={320} title="PostHog" />
        </div>
        <h1>PostHog brand assets</h1>
        <p>
          The logo, colors, hedgehogs, and crests — as a bundled, offline React package. Everything
          below is rendered live from <code>@posthog/brand</code>, no CDN and no screenshots. This
          is meant to grow into the home for{" "}
          <a href="https://posthog.com/handbook/company/brand-assets">brand assets</a>.
        </p>
        <span className="pill">pnpm add @posthog/brand</span>
      </section>

      <section className="section">
        <h2>Quick start</h2>
        <CodeBlock code={QUICK_START} />
      </section>

      <section className="section">
        <h2>Explore</h2>
        <div className="grid grid-cards">
          <Link to="/logo" className="card nav-card">
            <div className="nav-card-preview">
              <Logo layout="stacked" size={64} />
            </div>
            <h3>Logo →</h3>
            <p>One parametric &lt;Logo&gt; — every lockup, gradient/print/mono, any color.</p>
          </Link>

          <Link to="/fonts" className="card nav-card">
            <div className="nav-card-preview" aria-hidden>
              <span style={{ fontWeight: 800, fontSize: 40, letterSpacing: "-0.02em" }}>Aa</span>
            </div>
            <h3>Fonts →</h3>
            <p>RoundHog, the brand typeface — eight bundled woff2 faces, ready to inject.</p>
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
            <h3>Colors →</h3>
            <p>{colorCount} brand colors, each with a tonal ramp, gradient, and CSS token.</p>
          </Link>

          <Link to="/hoggies" className="card nav-card">
            <div className="nav-card-preview">
              <HedgehogDoctorHog size={64} />
              <HedgehogAngel size={64} />
              <HedgehogBallHog size={64} />
            </div>
            <h3>Hoggies →</h3>
            <p>{hoggieCount} hedgehog illustrations as tree-shakeable React components.</p>
          </Link>

          <Link to="/crests" className="card nav-card">
            <div className="nav-card-preview">
              <ArrayCrest size={70} />
              <ArrayCrest.Mini size={40} />
            </div>
            <h3>Crests →</h3>
            <p>{crestCount} team crests, each in a full and a mini badge tier.</p>
          </Link>
        </div>
      </section>
    </div>
  )
}
