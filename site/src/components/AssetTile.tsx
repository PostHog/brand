import type { SvgAssetComponent } from "@posthog/brand"
import { createElement, useRef, useState, type ComponentType } from "react"
import { Link } from "react-router-dom"

interface AssetTileProps {
  /** The live component to render. */
  Comp: SvgAssetComponent
  /** Friendly display name. */
  name: string
  /** Asset slug, shown in mono under the name. */
  slug: string
  /** Text copied to the clipboard when the tile is clicked (e.g. an import line). */
  copyValue: string
  /** When set, renders a corner link to this route (e.g. an isolated detail page). */
  to?: string
  /** For a compound variant component, which variant to render (e.g. a numbered hog). */
  variant?: string
}

/** A clickable grid tile that renders a live asset and copies `copyValue` on click. */
export function AssetTile({ Comp, name, slug, copyValue, to, variant }: AssetTileProps) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  function onClick() {
    void navigator.clipboard.writeText(copyValue).then(() => {
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 1200)
    })
  }

  return (
    <div className="asset-tile-wrap" style={{ position: "relative", display: "flex" }}>
      <button
        type="button"
        className={`card asset${copied ? " copied" : ""}`}
        onClick={onClick}
        title={`Copy: ${copyValue}`}
        style={{ width: "100%" }}
      >
        <span className="asset-art">
          {createElement(Comp as ComponentType<Record<string, unknown>>, {
            size: 88,
            title: name,
            ...(variant ? { variant } : {}),
          })}
        </span>
        <span className="asset-name">{name}</span>
        <span className="asset-slug">{copied ? "Copied!" : slug}</span>
      </button>
      {to ? (
        <Link
          to={to}
          className="asset-open"
          title="Open on its own page"
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            fontSize: 12,
            textDecoration: "none",
          }}
        >
          ↗
        </Link>
      ) : null}
    </div>
  )
}
