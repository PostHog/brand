import { useRef, useState } from "react"
import { Link } from "react-router-dom"

interface AssetTileProps {
  /** Bundled PNG URL to show as the thumbnail. When absent, a placeholder glyph is shown. */
  src?: string
  /** Tiny blurred data-URI shown behind the image until it finishes loading (blur-up). */
  placeholder?: string
  /** Friendly display name (also the image's alt text). */
  name: string
  /** Asset slug (or usage snippet), shown in mono under the name. */
  slug: string
  /** Text copied to the clipboard when the tile is clicked (e.g. an import line). */
  copyValue: string
  /** When set, renders a corner link to this route (e.g. an isolated detail page). */
  to?: string
}

/** A clickable grid tile that shows an asset's PNG thumbnail and copies `copyValue` on click. */
export function AssetTile({ src, placeholder, name, slug, copyValue, to }: AssetTileProps) {
  const [copied, setCopied] = useState(false)
  const [loaded, setLoaded] = useState(false)
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
