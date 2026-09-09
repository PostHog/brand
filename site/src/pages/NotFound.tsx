import { HedgehogMagnifyingGlass } from "@posthog/brand/hoggies"
import { Link, useLocation } from "react-router-dom"

/**
 * The `*` route. Without it an unknown path (a typo, an old link, `/hoggies/<name>`)
 * matches nothing and renders an empty content area, which is indistinguishable from a
 * crash.
 *
 * The hog holding an empty magnifying glass is the whole joke, so it is rendered as the
 * real inline-SVG component rather than a thumbnail: crisp at any size, and it stays out
 * of the initial bundle because `App` lazy-loads this route like the catalog ones.
 */
export function NotFoundPage() {
  const { pathname } = useLocation()

  return (
    <div className="notfound">
      <HedgehogMagnifyingGlass
        className="notfound-hog"
        title="A hedgehog looking for your page through an empty magnifying glass"
      />

      <p className="notfound-code">404</p>
      <h1 className="notfound-title">Nothing here but spikes</h1>
      <p className="notfound-lede">
        We had our best hog search for <code>{pathname}</code>. The magnifying glass came back
        empty.
      </p>

      <div className="notfound-actions">
        <Link to="/" className="btn btn-primary">
          Back to the overview
        </Link>
        <Link to="/hoggies" className="btn">
          Browse the hoggies
        </Link>
        <Link to="/crests" className="btn">
          Browse the crests
        </Link>
      </div>
    </div>
  )
}
