import { Link } from "react-router-dom"
import { PageHeader } from "../components/PageHeader.tsx"
import { MAKERS } from "../image-maker/makers.ts"
import { useSeo } from "../useSeo.ts"

// The image makers' home: one card per format, each with an example made in that maker.

export function ImageMakersPage() {
  useSeo("/tools/images")
  return (
    <div>
      <PageHeader eyebrow="image makers" title="Make a PostHog image">
        Pick a maker. Each one draws with the hoggies, colors and RoundHog from{" "}
        <code>@posthog/brand</code>, keeps the images you make in a list, and downloads a PNG ready
        to post. The settings live in the link, so copy it to share or come back to an image.
      </PageHeader>

      <section className="section" aria-labelledby="makers">
        <h2 id="makers">Makers</h2>
        <ul className="grid maker-cards">
          {MAKERS.map((maker) => (
            <li key={maker.slug}>
              <Link className="card maker-card" to={`/tools/images/${maker.slug}`}>
                <span className="maker-card-shot">
                  <img src={maker.preview} alt={maker.previewAlt} loading="lazy" />
                </span>
                <span className="maker-card-body">
                  <span className="maker-card-name">{maker.name}</span>
                  <span className="maker-card-desc">{maker.description}</span>
                  <span className="maker-card-sizes">
                    {maker.sizes.map((size) => (
                      <code key={size}>{size}</code>
                    ))}
                  </span>
                  <span className="maker-card-foot">
                    <span className="btn btn-primary btn-sm">Open maker</span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
          <li>
            <div className="maker-card-soon">
              <strong>More formats on the way</strong>
              <p>Social and other formats will show up here as new makers.</p>
            </div>
          </li>
        </ul>
      </section>
    </div>
  )
}
