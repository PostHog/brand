import type { Release } from "@posthog/brand"
import { formatReleaseDate, releaseUrl } from "../release.ts"

/** "Added in v0.9.0 (Jul 28, 2026)", linking the release — or a note that it hasn't shipped. */
export function SinceNote({ since }: { since: Release | undefined }) {
  if (!since) return <>New, not in a release yet</>
  return (
    <>
      Added in <a href={releaseUrl(since.version)}>v{since.version}</a> (
      {formatReleaseDate(since.date)})
    </>
  )
}
