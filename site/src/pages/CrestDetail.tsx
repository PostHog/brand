import { getAsset, getComponentName, type CrestTier } from "@posthog/brand"
import { Link, useParams } from "react-router-dom"
import { crestPagePath, markdownPath } from "../agent-paths.ts"
import { crestPng, crestSvg } from "../assets-crests.ts"
import { AssetDetailCard } from "../components/AssetDetailCard.tsx"
import { PageHeader } from "../components/PageHeader.tsx"
import { crestPageSeo } from "../seo.ts"
import { useSeo } from "../useSeo.ts"

// A single crest on its own page — renders the full illustration and the mini badge in
// isolation (nothing else heavy on the page). Useful for telling apart a per-asset defect
// from a page-level rendering problem: if a crest looks broken in the grid but fine here,
// the asset is sound and the issue is something about rendering many of them at once.
export function CrestDetailPage() {
  const { slug = "" } = useParams()
  const fullImg = crestPng(slug, "full")
  const miniImg = crestPng(slug, "mini")
  const asset = getAsset("crests", slug, "full")

  // Per-crest metadata, from the same helper the build prerenders `/crests/<slug>.html` with,
  // so navigating here client-side describes the crest exactly as the served HTML does. A slug
  // nobody has is a soft 404 — keep it unindexed.
  useSeo(
    crestPagePath(slug),
    asset
      ? crestPageSeo(asset.name, slug, asset.tags)
      : {
          title: "Crest not found",
          description: `No PostHog crest matches the slug "${slug}".`,
          noindex: true,
        },
  )

  if (!fullImg.src || !asset) {
    return (
      <div>
        <PageHeader eyebrow="@posthog/brand/crests" title="Crest not found">
          We don't have a crest called <code>{slug}</code>. <Link to="/crests">See all crests</Link>
          .
        </PageHeader>
      </div>
    )
  }

  const baseName = getComponentName("crests", slug, "full")

  return (
    <div>
      <PageHeader eyebrow="@posthog/brand/crests" title={asset.name}>
        Click either one to copy it as a PNG, or right-click for the import line or the SVG.
        <br />
        <Link to="/crests">All crests</Link> · <code>{slug}</code> ·{" "}
        <a href={markdownPath(crestPagePath(slug))}>Markdown</a>
      </PageHeader>

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        <CrestCard
          slug={slug}
          tier="full"
          src={fullImg.src}
          name={asset.name}
          baseName={baseName}
        />

        {miniImg.src ? (
          <CrestCard
            slug={slug}
            tier="mini"
            src={miniImg.src}
            name={asset.name}
            baseName={baseName}
          />
        ) : (
          <div className="card" style={{ textAlign: "center", opacity: 0.6 }}>
            <div style={{ padding: "48px 0" }}>This crest has no mini badge.</div>
          </div>
        )}
      </div>
    </div>
  )
}

interface CrestCardProps {
  slug: string
  tier: CrestTier
  src: string
  name: string
  baseName: string
}

/** One tier of the crest, large. */
function CrestCard({ slug, tier, src, name, baseName }: CrestCardProps) {
  const mini = tier === "mini"
  return (
    <AssetDetailCard
      asset={{ type: "crest", slug, tier }}
      src={src}
      alt={`${name} (${tier})`}
      label={mini ? `${baseName}.Mini` : baseName}
      caption={tier}
      importLine={`import { ${baseName} } from "@posthog/brand/crests"`}
      usage={mini ? `<${baseName}.Mini />` : `<${baseName} />`}
      svg={crestSvg(slug, tier)}
    />
  )
}
