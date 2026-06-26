import { findAssets, getComponentName } from "@posthog/brand"
import { useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { crestComponent } from "../assets-crests.ts"
import { AssetTile } from "../components/AssetTile.tsx"
import { EmptyState } from "../components/EmptyState.tsx"
import { PageHeader } from "../components/PageHeader.tsx"

type Tier = "full" | "mini"

// One entry per crest slug (full tier); the mini is the same slug's `.Mini`.
const ALL = findAssets({ namespace: "crests", tier: "full" })

export function CrestsPage() {
  const [query, setQuery] = useState("")

  // The tier lives in the `?tier=` query param, so it's read on first render and
  // shareable/bookmarkable.
  const [searchParams, setSearchParams] = useSearchParams()
  const tier: Tier = searchParams.get("tier") === "mini" ? "mini" : "full"
  const setTier = (next: Tier) => {
    setSearchParams(
      (prev) => {
        if (next === "mini") prev.set("tier", "mini")
        else prev.delete("tier")
        return prev
      },
      { replace: true },
    )
  }

  const results = useMemo(() => {
    return findAssets({ namespace: "crests", tier: "full", text: query }).sort((a, b) =>
      a.name.localeCompare(b.name),
    )
  }, [query])

  return (
    <div>
      <PageHeader eyebrow="@posthog/brand/crests" title="Crests">
        {ALL.length} team crests. Each is a compound component — the full illustration plus a{" "}
        <code>.Mini</code> badge tier. Click any one to copy its import line.
      </PageHeader>

      <div className="toolbar">
        <input
          className="input"
          type="search"
          placeholder="Search crests by name or tag…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="seg" role="group" aria-label="Crest tier">
          <button
            type="button"
            className={tier === "full" ? "active" : undefined}
            onClick={() => setTier("full")}
          >
            Full
          </button>
          <button
            type="button"
            className={tier === "mini" ? "active" : undefined}
            onClick={() => setTier("mini")}
          >
            Mini
          </button>
        </div>
        <span className="count">
          {results.length} of {ALL.length}
        </span>
      </div>

      {results.length === 0 ? (
        <EmptyState query={query} noun="crests" onClear={() => setQuery("")} />
      ) : (
        <div className="grid grid-assets">
          {results.map((asset) => {
            const compound = crestComponent(asset.slug)
            if (!compound) return null
            const showMini = tier === "mini" && compound.Mini
            const Comp = showMini ? compound.Mini! : compound
            const baseName = getComponentName("crests", asset.slug, "full")
            const usage = showMini ? `${baseName}.Mini` : baseName
            return (
              <AssetTile
                key={asset.slug}
                Comp={Comp}
                name={asset.name}
                slug={usage}
                copyValue={`import { ${baseName} } from "@posthog/brand/crests"`}
                to={`/crests/${asset.slug}`}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
