import posthog from "posthog-js"
import { absoluteUrl } from "../agent-paths.ts"
import { PageHeader } from "../components/PageHeader.tsx"
import {
  HERO_IMAGE_GROUPS,
  type HeroImage,
  type HeroImageGroup,
  heroFileName,
  heroImagePath,
  heroImageSize,
  heroPreviewPath,
} from "../hero-images.ts"
import { useSeo } from "../useSeo.ts"

// The hero images from the brand book: one sideways-scrolling row per kind. What each kind is for
// lives in the markdown twin and the prerendered shell; the page itself stays short. It shows a
// WebP preview; the full-resolution PNG (rendered by `scripts/fetch-hero-images.ts`) is one click
// away, so a 3 MB file only loads when someone asks for it.

function HeroCard({ image, group }: { image: HeroImage; group: HeroImageGroup }) {
  const { width, height } = heroImageSize(group)
  const png = heroImagePath(image.id)
  const capture = (action: "downloaded" | "opened") =>
    posthog.capture("asset downloaded", {
      asset_type: "hero-image",
      asset_slug: image.id,
      format: "png",
      source: action === "downloaded" ? "link" : "open",
    })
  return (
    <li className="card hero-card">
      <a
        className="hero-preview"
        href={png}
        target="_blank"
        rel="noopener"
        title="Open the full-size PNG"
        onClick={() => capture("opened")}
      >
        <img
          src={heroPreviewPath(image.id)}
          alt={image.alt}
          width={group.frame.width}
          height={group.frame.height}
          loading="lazy"
          decoding="async"
        />
      </a>
      <div className="hero-body">
        <h3>{image.name}</h3>
        <a
          className="btn btn-sm"
          href={png}
          download={`${heroFileName(image.id)}.png`}
          title={absoluteUrl(png)}
          onClick={() => capture("downloaded")}
        >
          PNG {width}×{height}
        </a>
      </div>
    </li>
  )
}

export function HeroImagesPage() {
  useSeo("/hero-images")
  return (
    <div>
      <PageHeader eyebrow="brand.posthog.com/hero-images" title="Hero images">
        Missing something? Reach out to the Graphics team internally.
      </PageHeader>

      {HERO_IMAGE_GROUPS.map((group) => (
        <section key={group.id} id={group.id} className="section">
          <h2>{group.title}</h2>
          {/* Focusable so the row scrolls from the keyboard too. */}
          <ul className={`hero-row hero-row-${group.id}`} tabIndex={0} aria-label={group.title}>
            {group.images.map((image) => (
              <HeroCard key={image.id} image={image} group={group} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
