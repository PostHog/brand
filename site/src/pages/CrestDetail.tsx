import { getAsset, getComponentName, type CrestTier } from "@posthog/brand"
import { Link, useParams } from "react-router-dom"
import { crestPng, crestSvg } from "../assets-crests.ts"
import { useAssetCopy } from "../components/CopyMenu.tsx"
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
  const seo = asset ? crestPageSeo(asset.name, slug) : undefined
  useSeo(`/crests/${slug}`, {
    title: seo?.title ?? "Crest not found",
    label: seo?.label ?? "Crest not found",
    description: seo?.description ?? `No PostHog crest matches the slug "${slug}".`,
    noindex: !seo,
  })

  if (!fullImg.src || !asset) {
    return (
      <div>
        <PageHeader eyebrow="@posthog/brand/crests" title="Crest not found">
          No crest with slug <code>{slug}</code>. <Link to="/crests">Back to all crests</Link>.
        </PageHeader>
      </div>
    )
  }

  const baseName = getComponentName("crests", slug, "full")

  return (
    <div>
      <PageHeader eyebrow="@posthog/brand/crests" title={asset.name}>
        <Link to="/crests">← All crests</Link> · slug <code>{slug}</code> · click either one to copy
        its PNG, right-click for the import line or SVG
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
            <div style={{ padding: "48px 0" }}>No mini tier for this crest.</div>
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

/** One tier of the crest, large; click/right-click copy exactly like a grid tile. */
function CrestCard({ slug, tier, src, name, baseName }: CrestCardProps) {
  const copy = useAssetCopy({
    importLine: `import { ${baseName} } from "@posthog/brand/crests"`,
    png: src,
    svg: crestSvg(slug, tier),
  })
  const status = copy.status
  const label = tier === "mini" ? `${baseName}.Mini` : baseName

  return (
    <>
      <button
        type="button"
        className={`card asset${status ? (status.ok ? " copied" : " copy-failed") : ""}`}
        onClick={copy.onClick}
        onContextMenu={copy.onContextMenu}
        title="Click to copy the PNG; right-click for the import line or SVG"
      >
        <span style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
          <img
            src={src}
            alt={`${name} (${tier})`}
            decoding="async"
            style={{ height: 240, width: "auto", maxWidth: "100%", objectFit: "contain" }}
          />
        </span>
        <span className="asset-name">{label}</span>
        <span className="asset-slug" aria-live="polite">
          {status ? status.label : tier}
        </span>
      </button>
      {copy.menu}
    </>
  )
}
