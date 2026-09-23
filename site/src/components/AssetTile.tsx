import { useState } from "react"
import { Link } from "react-router-dom"
import type { SvgLoader } from "../assets-hoggies.ts"
import { useAssetCopy } from "./CopyMenu.tsx"

interface AssetTileProps {
  /** Bundled PNG URL to show as the thumbnail. When absent, a placeholder glyph is shown. */
  src?: string
  /** Tiny blurred data-URI shown behind the image until it finishes loading (blur-up). */
  placeholder?: string
  /** Friendly display name (also the image's alt text). */
  name: string
  /** Asset slug (or usage snippet), shown in mono under the name. */
  slug: string
  /** The import line, offered in the right-click menu. */
  importLine: string
  /** A JSX snippet for this asset; when set, the menu also offers "Copy JSX". */
  usage?: string
  /** Lazily loads the asset's SVG, for the right-click menu's SVG options. */
  svg: SvgLoader
  /** When set, renders a corner link to this route (e.g. an isolated detail page). */
  to?: string
}

/**
 * A clickable grid tile that shows an asset's PNG thumbnail. Click copies the PNG (see
 * `useAssetCopy`); right-click opens a menu to copy the import line, SVG, or PNG.
 */
export function AssetTile({
  src,
  placeholder,
  name,
  slug,
  importLine,
  usage,
  svg,
  to,
}: AssetTileProps) {
  const [loaded, setLoaded] = useState(false)
  const copy = useAssetCopy({ importLine, usage, png: src, svg })
  const status = copy.status

  return (
    <div className="asset-tile-wrap" style={{ position: "relative", display: "flex" }}>
      <button
        type="button"
        className={`card asset${status ? (status.ok ? " copied" : " copy-failed") : ""}`}
        onClick={copy.onClick}
        onContextMenu={copy.onContextMenu}
        title="Click to copy the PNG; right-click for the import line or SVG"
        style={{ width: "100%" }}
      >
        <span className="asset-art">
          {/* Blurred stand-in paints instantly and is revealed until the real image loads. */}
          {src && placeholder && !loaded ? (
            <span
              className="asset-blur"
              aria-hidden="true"
              style={{ backgroundImage: `url(${placeholder})` }}
            />
          ) : null}
          {src ? (
            // Lazy + async so only tiles scrolled into view fetch their (separate) PNG file.
            <img
              className={`asset-img${loaded ? " loaded" : ""}`}
              src={src}
              alt={name}
              loading="lazy"
              decoding="async"
              onLoad={() => setLoaded(true)}
            />
          ) : (
            <span className="asset-missing" aria-hidden="true">
              —
            </span>
          )}
        </span>
        <span className="asset-name">{name}</span>
        <span className="asset-slug" aria-live="polite">
          {status ? status.label : slug}
        </span>
      </button>
      {copy.menu}
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
