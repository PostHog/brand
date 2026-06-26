// Parse a Figma component description into a normalized list of search tags.
//
// Tags are authored in the component's Description field as a separated list, optionally
// introduced by a "Tags:" (or "Tag:") label that may sit on its own line after other
// prose. When a label is present only its line is read; otherwise the whole description is
// treated as the list.
//
// Authors are inconsistent about the separator, so we are deliberately lax: entries are
// split on commas, slashes, periods, and newlines, then trimmed, emptied-dropped, and
// de-duplicated case-insensitively (first spelling wins, author order preserved). Original
// casing is kept for display; search lower-cases itself. This is intentionally greedy — a
// stray "Dr. Manhattan" becomes "Dr"/"Manhattan" — because over-splitting just yields some
// harmless extra tags that can be tidied in Figma, whereas under-splitting hides assets
// from search. Splitting on hyphens/spaces would be too greedy ("hi-vis", "lab coat"), so
// those are left intact.

/** Separators we split a tag list on: comma, slash, period, or newline. */
const SEPARATORS = /[,/.\n]/

/** Captures the remainder of the first `Tags:` / `Tag:` line, if the description has one. */
const TAGS_LABEL_RE = /^[ \t]*tags?[ \t]*:[ \t]*(.+)$/im

export function parseTags(description?: string | null): string[] {
  if (!description) return []
  const labeled = description.match(TAGS_LABEL_RE)
  const source = labeled ? labeled[1]! : description

  const out: string[] = []
  const seen = new Set<string>()
  for (const raw of source.split(SEPARATORS)) {
    const tag = raw.trim()
    if (!tag) continue
    const key = tag.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(tag)
  }
  return out
}
