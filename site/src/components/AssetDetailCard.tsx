import type { AssetRef } from "../agent-paths.ts"
import type { SvgLoader } from "../assets-hoggies.ts"
import { CopyFlash } from "./CopyFlash.tsx"
import { useAssetCopy } from "./CopyMenu.tsx"
import { DownloadLinks } from "./DownloadLinks.tsx"

interface AssetDetailCardProps {
  asset: AssetRef
  /** Bundled PNG URL to display. */
  src: string
  alt: string
  /** Mono label under the image, e.g. the component name. */
  label: string
  /** Muted line under the label (the tier, the variant). */
  caption: string
  importLine: string
  usage?: string
  svg: SvgLoader
}

/**
 * One asset, large, on its own detail page: click/right-click copy exactly like a grid tile,
 * plus plain download links to its static SVG and PNG.
 */
export function AssetDetailCard({
  asset,
  src,
  alt,
  label,
  caption,
  importLine,
  usage,
  svg,
}: AssetDetailCardProps) {
  const copy = useAssetCopy({ asset, importLine, usage, png: src, svg })

  return (
    <div className="detail-card">
      <button
        type="button"
        className="card asset"
        onClick={copy.onClick}
        onContextMenu={copy.onContextMenu}
        title="Click to copy the PNG; right-click for the import line or SVG"
      >
        <span style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
          <img
            src={src}
            alt={alt}
            decoding="async"
            style={{ height: 240, width: "auto", maxWidth: "100%", objectFit: "contain" }}
          />
        </span>
        <span className="asset-name">{label}</span>
        <span className="asset-slug">{caption}</span>
        <CopyFlash status={copy.status} />
      </button>
      {copy.menu}
      <DownloadLinks asset={asset} />
    </div>
  )
}
