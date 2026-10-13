import { Link, useParams } from "react-router-dom"
import { hoggiePagePath, markdownPath } from "../agent-paths.ts"
import { hoggiePng, hoggieSvg } from "../assets-hoggies.ts"
import { AssetDetailCard } from "../components/AssetDetailCard.tsx"
import { CodeBlock } from "../components/CodeBlock.tsx"
import { PageHeader } from "../components/PageHeader.tsx"
import { hoggieFamilies, hoggieJsx } from "../hoggie-families.ts"
import { hoggiePageSeo } from "../seo.ts"
import { useSeo } from "../useSeo.ts"

const FAMILIES = hoggieFamilies()

// One hoggie on its own page: big, copyable, with download links to its static SVG/PNG and
// the import. A numbered variant family (`<HedgehogNoir variant="5" />`) is one page showing
// every member, since they share one component.
export function HoggieDetailPage() {
  const { slug = "" } = useParams()
  const family = FAMILIES.get(slug)

  // Same metadata the build prerenders `/hoggies/<slug>.html` with; an unknown slug is a soft
  // 404, kept unindexed.
  useSeo(
    hoggiePagePath(slug),
    family
      ? hoggiePageSeo(family.name, slug, family.tags, family.members[0]?.variant?.variant)
      : {
          title: "Hoggie not found",
          description: `No PostHog hedgehog matches the slug "${slug}".`,
          noindex: true,
        },
  )

  if (!family) {
    return (
      <div>
        <PageHeader eyebrow="@posthog/brand/hoggies" title="Hoggie not found">
          No hoggie with slug <code>{slug}</code>. <Link to="/hoggies">Back to all hoggies</Link>.
        </PageHeader>
      </div>
    )
  }

  const { component, members, tags } = family
  const importLine = `import { ${component} } from "@posthog/brand/hoggies"`
  const variants = members.map((asset) => {
    const key = asset.variant?.variant
    return { asset, key, jsx: hoggieJsx(component, key) }
  })

  return (
    <div>
      <PageHeader eyebrow="@posthog/brand/hoggies" title={family.name}>
        <Link to="/hoggies">← All hoggies</Link> · slug <code>{slug}</code>
        {variants[0]?.key ? ` · ${variants.length} variants` : ""} · click to copy the PNG,
        right-click for the import line or SVG ·{" "}
        <a href={markdownPath(hoggiePagePath(slug))}>markdown</a>
        {tags.length ? (
          <>
            <br />
            Tags: {tags.join(", ")}
          </>
        ) : null}
      </PageHeader>

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        {variants.map(({ asset, key, jsx }) => {
          const img = hoggiePng(slug, key)
          if (!img.src) return null
          return (
            <AssetDetailCard
              key={key ?? slug}
              asset={{ type: "hoggie", slug, variant: key }}
              src={img.src}
              alt={key ? `${asset.name}, variant ${key}` : asset.name}
              label={component}
              caption={key ? `variant="${key}"` : slug}
              importLine={importLine}
              usage={jsx}
              svg={hoggieSvg(slug, key)}
            />
          )
        })}
      </div>

      <section className="section">
        <h2>Use it in React</h2>
        <CodeBlock
          slug="hoggie-usage"
          code={[importLine, "", ...variants.map(({ jsx }) => jsx)].join("\n")}
        />
      </section>
    </div>
  )
}
