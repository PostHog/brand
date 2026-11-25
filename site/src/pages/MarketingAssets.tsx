import posthog from "posthog-js"
import { absoluteUrl } from "../agent-paths.ts"
import { PageHeader } from "../components/PageHeader.tsx"
import {
  MARKETING_ASSET_GROUPS,
  type MarketingAsset,
  type MarketingAssetFile,
  type MarketingAssetGroup,
  marketingAssetFiles,
  marketingPreviewPath,
} from "../marketing-assets.ts"
import { useSeo } from "../useSeo.ts"

// The marketing assets from the brand book: one sideways-scrolling row per kind. What each kind is for
// lives in the markdown twin and the prerendered shell; the page itself stays short. It shows a
// WebP preview; the full-resolution PNG (rendered by `scripts/fetch-marketing-assets.ts`) is one click
// away, so a 3 MB file only loads when someone asks for it. An image that comes in several shapes
// (the heroes' 16:11 and 16:9) previews the first and gets one download button per shape.

function MarketingCard({ image, group }: { image: MarketingAsset; group: MarketingAssetGroup }) {
  const files = marketingAssetFiles(image, group)
  const [first] = files
  const capture = (file: MarketingAssetFile, action: "downloaded" | "opened") =>
    posthog.capture("asset downloaded", {
      asset_type: "marketing-asset",
      asset_slug: image.id,
      format: "png",
      aspect_ratio: file.ratio,
      source: action === "downloaded" ? "link" : "open",
    })
  return (
    <li className="card marketing-card">
      <a
        className="marketing-preview"
        href={first!.path}
        target="_blank"
        rel="noopener"
        title="Open the full-size PNG"
        onClick={() => capture(first!, "opened")}
      >
        <img
          src={marketingPreviewPath(image.id)}
          alt={image.alt}
          width={first!.width}
          height={first!.height}
          loading="lazy"
          decoding="async"
        />
      </a>
      <div className="marketing-body">
        <h3>{image.name}</h3>
        <div className="marketing-downloads">
          {files.map((file) => (
            <a
              key={file.path}
              className="btn btn-sm"
              href={file.path}
              download={`${file.fileName}.png`}
              title={absoluteUrl(file.path)}
              onClick={() => capture(file, "downloaded")}
            >
              {file.ratio ? `${file.ratio} · ` : "PNG "}
              {file.width}×{file.height}
            </a>
          ))}
        </div>
      </div>
    </li>
  )
}

export function MarketingAssetsPage() {
  useSeo("/marketing-assets")
  return (
    <div>
      <PageHeader eyebrow="brand.posthog.com/marketing-assets" title="Marketing assets">
        Missing something? Reach out to the Graphics team internally.
      </PageHeader>

      {MARKETING_ASSET_GROUPS.map((group) => (
        <section key={group.id} id={group.id} className="section">
          <h2>{group.title}</h2>
          {/* Focusable so the row scrolls from the keyboard too. */}
          <ul
            className={`marketing-row marketing-row-${group.id}`}
            tabIndex={0}
            aria-label={group.title}
          >
            {group.images.map((image) => (
              <MarketingCard key={image.id} image={image} group={group} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
