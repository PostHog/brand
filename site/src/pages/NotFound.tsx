import { Link, useLocation } from "react-router-dom"
import { PageHeader } from "../components/PageHeader.tsx"

/**
 * The `*` route. Without it an unknown path (a typo, an old link, `/hoggies/<name>`)
 * matches nothing and renders an empty content area — indistinguishable from a crash.
 */
export function NotFoundPage() {
  const { pathname } = useLocation()

  return (
    <div>
      <PageHeader eyebrow="404" title="Page not found">
        Nothing lives at <code>{pathname}</code>.
      </PageHeader>

      <p>
        Try the <Link to="/hoggies">hoggies</Link> or <Link to="/crests">crests</Link> catalog —
        both are searchable — or head <Link to="/">back to the overview</Link>.
      </p>
    </div>
  )
}
