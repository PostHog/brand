import type { AssetRef } from "../analytics.ts"
import type { SvgLoader } from "../assets-hoggies.ts"
import { useAssetCopy } from "./CopyMenu.tsx"
import { DownloadLinks } from "./DownloadLinks.tsx"

interface AssetDetailCardProps {
  asset: AssetRef
  /** Bundled PNG URL to display. */
  src: string
  alt: string
  /** Mono label under the image, e.g. the component name. */
  label: string
  /** Muted line under the label (the tier, the variant), replaced by copy feedback. */
  caption: string
  importLine: string
  usage?: string
  svg: SvgLoader
  /** Base name (no extension) for downloads, e.g. `posthog-crest-marketing-mini`. */
  fileName: string
  /** Site paths of the static files. */
  svgPath: string
  pngPath: string
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
  fileName,
  svgPath,
  pngPath,
}: AssetDetailCardProps) {
  const copy = useAssetCopy({ asset, importLine, usage, png: src, svg, fileName })
  const status = copy.status

  return (
    <div className="detail-card">
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
            alt={alt}
            decoding="async"
            style={{ height: 240, width: "auto", maxWidth: "100%", objectFit: "contain" }}
          />
        </span>
        <span className="asset-name">{label}</span>
        <span className="asset-slug" aria-live="polite">
          {status ? status.label : caption}
        </span>
      </button>
      {copy.menu}
      <DownloadLinks asset={asset} svg={svgPath} png={pngPath} fileName={fileName} />
    </div>
  )
}
