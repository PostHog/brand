import posthog from "posthog-js"
import { absoluteUrl, type ImageFormat } from "../agent-paths.ts"
import { assetProperties, type AssetRef } from "../analytics.ts"

interface DownloadLinksProps {
  asset: AssetRef
  /** Site paths of the static files, e.g. `/hoggies/chart.svg`. */
  svg: string
  png: string
  /** Base name (no extension) the browser saves as, e.g. `posthog-hedgehog-chart`. */
  fileName: string
}

/**
 * Plain links to an asset's static SVG and PNG — the same stable URLs the markdown, llms.txt
 * and catalog.json hand to agents, so a person can copy one straight into a doc or a prompt.
 */
export function DownloadLinks({ asset, svg, png, fileName }: DownloadLinksProps) {
  const link = (path: string, format: ImageFormat) => (
    <a
      className="btn"
      href={path}
      download={`${fileName}.${format}`}
      title={absoluteUrl(path)}
      onClick={() =>
        posthog.capture("asset downloaded", { ...assetProperties(asset), format, source: "link" })
      }
    >
      Download {format.toUpperCase()}
    </a>
  )
  return (
    <span className="download-links">
      {link(svg, "svg")}
      {link(png, "png")}
    </span>
  )
}
