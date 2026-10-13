import posthog from "posthog-js"
import {
  absoluteUrl,
  assetFileName,
  assetFilePath,
  type AssetRef,
  type ImageFormat,
} from "../agent-paths.ts"
import { assetProperties } from "../analytics.ts"

/**
 * Plain links to an asset's static SVG and PNG — the same stable URLs the markdown, llms.txt
 * and catalog.json hand to agents, so a person can copy one straight into a doc or a prompt.
 */
export function DownloadLinks({ asset }: { asset: AssetRef }) {
  const link = (format: ImageFormat) => {
    const path = assetFilePath(asset, format)
    return (
      <a
        className="btn"
        href={path}
        download={`${assetFileName(asset)}.${format}`}
        title={absoluteUrl(path)}
        onClick={() =>
          posthog.capture("asset downloaded", { ...assetProperties(asset), format, source: "link" })
        }
      >
        Download {format.toUpperCase()}
      </a>
    )
  }
  return (
    <span className="download-links">
      {link("svg")}
      {link("png")}
    </span>
  )
}
