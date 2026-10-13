import { findAssets, getComponentName } from "@posthog/brand"
import { Link, useParams } from "react-router-dom"
import { hoggieFilePath, markdownPath } from "../agent-paths.ts"
import { hoggiePng, hoggieSvg } from "../assets-hoggies.ts"
import { AssetDetailCard } from "../components/AssetDetailCard.tsx"
import { CodeBlock } from "../components/CodeBlock.tsx"
import { PageHeader } from "../components/PageHeader.tsx"
import { hoggiePageSeo } from "../seo.ts"
import { useSeo } from "../useSeo.ts"

// One hoggie on its own page: big, copyable, with download links to its static SVG/PNG and
// the import. A numbered variant family (`<HedgehogNoir variant="5" />`) is one page showing
// every member, since they share one component.
export function HoggieDetailPage() {
  const { slug = "" } = useParams()
  const members = findAssets({ namespace: "hoggies" })
    .filter((asset) => asset.slug === slug)
    .sort((a, b) => Number(a.variant?.variant ?? 0) - Number(b.variant?.variant ?? 0))
  const first = members[0]
  const tags = [...new Set(members.flatMap((asset) => asset.tags ?? []))]

  // Same metadata the build prerenders `/hoggies/<slug>.html` with; an unknown slug is a soft
  // 404, kept unindexed.
  const seo = first ? hoggiePageSeo(first.name, slug, tags, first.variant?.variant) : undefined
  useSeo(`/hoggies/${slug}`, {
    title: seo?.title ?? "Hoggie not found",
    label: seo?.label ?? "Hoggie not found",
    description: seo?.description ?? `No PostHog hedgehog matches the slug "${slug}".`,
    noindex: !seo,
    parent: seo?.parent,
    image: seo?.image,
  })

  if (!first) {
    return (
      <div>
        <PageHeader eyebrow="@posthog/brand/hoggies" title="Hoggie not found">
          No hoggie with slug <code>{slug}</code>. <Link to="/hoggies">Back to all hoggies</Link>.
        </PageHeader>
      </div>
    )
  }

  const component = getComponentName("hoggies", slug)
  const importLine = `import { ${component} } from "@posthog/brand/hoggies"`
  const family = members.length > 1 || !!first.variant
  const snippet = [
    importLine,
    "",
    ...members.map((asset) =>
      asset.variant ? `<${component} variant="${asset.variant.variant}" />` : `<${component} />`,
    ),
  ].join("\n")

  return (
    <div>
      <PageHeader eyebrow="@posthog/brand/hoggies" title={first.name}>
        <Link to="/hoggies">← All hoggies</Link> · slug <code>{slug}</code>
        {family ? ` · ${members.length} variants` : ""} · click to copy the PNG, right-click for the
        import line or SVG · <a href={markdownPath(`/hoggies/${slug}`)}>markdown</a>
        {tags.length ? (
          <>
            <br />
            Tags: {tags.join(", ")}
          </>
        ) : null}
      </PageHeader>

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        {members.map((asset) => {
          const key = asset.variant?.variant
          const img = hoggiePng(slug, key)
          if (!img.src) return null
          const usage = key ? `<${component} variant="${key}" />` : `<${component} />`
          return (
            <AssetDetailCard
              key={key ?? slug}
              asset={{ type: "hoggie", slug, variant: key }}
              src={img.src}
              alt={key ? `${asset.name}, variant ${key}` : asset.name}
              label={component}
              caption={key ? `variant="${key}"` : slug}
              importLine={importLine}
              usage={usage}
              svg={hoggieSvg(slug, key)}
              fileName={`posthog-hedgehog-${slug}${key ? `-${key}` : ""}`}
              svgPath={hoggieFilePath(slug, key, "svg")}
              pngPath={hoggieFilePath(slug, key, "png")}
            />
          )
        })}
      </div>

      <section className="section">
        <h2>Use it in React</h2>
        <CodeBlock slug="hoggie-usage" code={snippet} />
      </section>
    </div>
  )
}
