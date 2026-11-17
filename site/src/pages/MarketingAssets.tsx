import posthog from "posthog-js"
import { absoluteUrl } from "../agent-paths.ts"
import { PageHeader } from "../components/PageHeader.tsx"
import {
  MARKETING_ASSET_GROUPS,
  type MarketingAsset,
  type MarketingAssetGroup,
  marketingFileName,
  marketingAssetPath,
  marketingAssetSize,
  marketingPreviewPath,
} from "../marketing-assets.ts"
import { useSeo } from "../useSeo.ts"

// The marketing assets from the brand book: one sideways-scrolling row per kind. What each kind is for
// lives in the markdown twin and the prerendered shell; the page itself stays short. It shows a
// WebP preview; the full-resolution PNG (rendered by `scripts/fetch-marketing-assets.ts`) is one click
// away, so a 3 MB file only loads when someone asks for it.

function MarketingCard({ image, group }: { image: MarketingAsset; group: MarketingAssetGroup }) {
  const { width, height } = marketingAssetSize(group)
  const png = marketingAssetPath(image.id)
  const capture = (action: "downloaded" | "opened") =>
    posthog.capture("asset downloaded", {
      asset_type: "marketing-asset",
      asset_slug: image.id,
      format: "png",
      source: action === "downloaded" ? "link" : "open",
    })
  return (
    <li className="card marketing-card">
      <a
        className="marketing-preview"
        href={png}
        target="_blank"
        rel="noopener"
        title="Open the full-size PNG"
        onClick={() => capture("opened")}
      >
        <img
          src={marketingPreviewPath(image.id)}
          alt={image.alt}
          width={group.frame.width}
          height={group.frame.height}
          loading="lazy"
          decoding="async"
        />
      </a>
      <div className="marketing-body">
        <h3>{image.name}</h3>
        <a
          className="btn btn-sm"
          href={png}
          download={`${marketingFileName(image.id)}.png`}
          title={absoluteUrl(png)}
          onClick={() => capture("downloaded")}
        >
          PNG {width}×{height}
        </a>
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
