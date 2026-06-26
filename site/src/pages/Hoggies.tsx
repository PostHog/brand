import { findAssets, getComponentName } from "@posthog/brand"
import { useMemo, useState } from "react"
import { hoggieComponent } from "../assets-hoggies.ts"
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
            const Comp = hoggieComponent(asset.slug)
            if (!Comp) return null
            const componentName = getComponentName("hoggies", asset.slug)
            return (
              <AssetTile
                key={asset.slug}
                Comp={Comp}
                name={asset.name}
                slug={asset.slug}
                copyValue={`import { ${componentName} } from "@posthog/brand/hoggies"`}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
