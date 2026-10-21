import type { Release } from "@posthog/brand"
import type { ReactNode } from "react"
import { formatReleaseDate, isNew, releaseUrl } from "../release.ts"

export interface AssetFact {
  label: string
  value: ReactNode
}

/** A detail page's facts as a labelled list (component, slug, release, tags, …), one per row. */
export function AssetFacts({ facts }: { facts: readonly (AssetFact | false | undefined)[] }) {
  return (
    <dl className="asset-facts">
      {facts.map((fact) =>
        fact ? (
          <div key={fact.label}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ) : null,
      )}
    </dl>
  )
}

/** The release that first shipped an asset: its version as a linked chip, the date, and "New". */
export function SinceValue({ since }: { since: Release | undefined }) {
  if (!since) {
    return (
      <>
        <span className="new-badge">New</span> not in a release yet
      </>
    )
  }
  return (
    <>
      <a href={releaseUrl(since.version)} title={`Changelog for v${since.version}`}>
        <code>v{since.version}</code>
      </a>{" "}
      on {formatReleaseDate(since.date)}
      {isNew(since) ? (
        <>
          {" "}
          <span className="new-badge">New</span>
        </>
      ) : null}
    </>
  )
}

/**
 * Tags, collapsed to a count — a long list would drown the rest. Hovering the count shows them
 * all, and find-in-page still reaches them: browsers open a closed `<details>` on a match.
 */
export function TagsValue({ tags }: { tags: readonly string[] }) {
  return (
    <details className="tag-list">
      <summary title={tags.join(", ")}>
        {tags.length} {tags.length === 1 ? "tag" : "tags"}
      </summary>
      <ul>
        {tags.map((tag) => (
          <li key={tag}>{tag}</li>
        ))}
      </ul>
    </details>
  )
}
