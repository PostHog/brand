import { findAssets, getComponentName } from "@posthog/brand"
import { useMemo, useState } from "react"
import { hoggiePng } from "../assets-hoggies.ts"
import { AssetTile } from "../components/AssetTile.tsx"
import { EmptyState } from "../components/EmptyState.tsx"
import { PageHeader } from "../components/PageHeader.tsx"

const ALL = findAssets({ namespace: "hoggies" })

export function HoggiesPage() {
  const [query, setQuery] = useState("")

  const results = useMemo(() => {
    return findAssets({ namespace: "hoggies", text: query }).sort((a, b) =>
      a.name.localeCompare(b.name),
    )
  }, [query])

  return (
    <div>
      <PageHeader eyebrow="@posthog/brand/hoggies" title="Hoggies">
        {ALL.length} hedgehog illustrations, each a tree-shakeable React component. Click any one to
        copy its import line.
      </PageHeader>

      <div className="toolbar">
        <input
          className="input"
          type="search"
          placeholder="Search hoggies by name or tag…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="count">
          {results.length} of {ALL.length}
        </span>
      </div>

      {results.length === 0 ? (
        <EmptyState query={query} noun="hoggies" onClear={() => setQuery("")} />
      ) : (
        <div className="grid grid-assets">
          {results.map((asset) => {
            const componentName = getComponentName("hoggies", asset.slug)

            // A variant family shares one slug across members, distinguished by `variant`.
            const variant = asset.variant?.variant
            const usage = variant
              ? `<${componentName} variant="${variant}" />`
              : `<${componentName} />`

            return (
              <AssetTile
                key={variant ? `${asset.slug}/${variant}` : asset.slug}
                {...hoggiePng(asset.slug, variant)}
                name={variant ? `${asset.name} ${variant}` : asset.name}
                slug={asset.slug}
                copyValue={usage}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
