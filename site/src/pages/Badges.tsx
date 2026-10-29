import { useEffect } from "react"
import { assetFilePath, LICENSE_URL } from "../agent-paths.ts"
import {
  BADGE_ALT,
  BADGE_SIZE,
  BADGE_USAGE,
  BADGES,
  type Badge,
  badgeHtml,
  badgeMarkdown,
} from "../badge-files.ts"
import { Callout } from "../components/Callout.tsx"
import { CodeBlock } from "../components/CodeBlock.tsx"
import { DownloadLinks } from "../components/DownloadLinks.tsx"
import { PageHeader } from "../components/PageHeader.tsx"
import { useSeo } from "../useSeo.ts"

// The "Built with PostHog" website badges. Each preview is the published file itself: once at
// 2× so its detail reads, and once at the size the embed code sets, which is exactly what lands
// on someone's site. The embed code is the main thing to copy, so it sits beside the preview.

function BadgeCard({ badge }: { badge: Badge }) {
  const { width, height } = BADGE_SIZE
  const src = assetFilePath({ type: "badge", slug: badge.id }, "svg")
  return (
    <div className="card badge-card">
      <div className={`logo-stage badge-stage${badge.background === "dark" ? " dark" : ""}`}>
        <figure>
          <img src={src} alt={BADGE_ALT} width={width * 2} height={height * 2} />
          <figcaption>2×</figcaption>
        </figure>
        <figure>
          <img src={src} alt="" width={width} height={height} />
          <figcaption>Actual size</figcaption>
        </figure>
      </div>
      <div className="badge-body">
        <h3>{badge.name}</h3>
        <p>{badge.when}</p>
        <p className="code-label">For a website</p>
        <CodeBlock slug={`${badge.id}-html`} code={badgeHtml(badge)} />
        <p className="code-label">For a README</p>
        <CodeBlock slug={`${badge.id}-markdown`} code={badgeMarkdown(badge)} plain />
        <DownloadLinks asset={{ type: "badge", slug: badge.id }} />
      </div>
    </div>
  )
}

export function BadgesPage() {
  useSeo("/badges")
  // The catalog links the usage terms as /badges#usage. This route renders after the browser's
  // own jump to a fragment, so scroll to it once it exists.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1))
    if (id) document.getElementById(id)?.scrollIntoView()
  }, [])

  return (
    <div>
      <PageHeader eyebrow="brand.posthog.com/badges" title="Built with PostHog badges">
        Tell people your product is built with PostHog. Paste a badge's code into your site's footer
        or your README, and it links back to posthog.com.
      </PageHeader>

      <section className="section">
        <h2>Choose a badge</h2>
        <p className="section-lede">
          Both badges have a solid background, so they work on any page. Pick the one that matches
          your footer. Keep the width and height in the code. At {BADGE_SIZE.width}×
          {BADGE_SIZE.height} px, the logo is 80 px wide, which is the smallest we use it.
        </p>
        <div className="badge-list">
          {BADGES.map((badge) => (
            <BadgeCard key={badge.id} badge={badge} />
          ))}
        </div>
        <p className="section-lede badge-note">
          The code loads the badge from brand.posthog.com. To host it yourself, download the SVG.
          Where SVG doesn't work, such as most email clients, use the PNG at the same size. If your
          site sets a Content Security Policy, add <code>https://brand.posthog.com</code> to{" "}
          <code>img-src</code>.
        </p>
      </section>

      <section className="section" id="usage">
        <h2>Using the badges</h2>
        <Callout type="info" title="Who can use them">
          <ul>
            {BADGE_USAGE.map((item) => (
              <li key={item}>{item}</li>
            ))}
            <li>
              PostHog's other brand assets are under the <a href={LICENSE_URL}>brand license</a>.
              Questions? Email <a href="mailto:marketing@posthog.com">marketing@posthog.com</a>.
            </li>
          </ul>
        </Callout>
      </section>
    </div>
  )
}
