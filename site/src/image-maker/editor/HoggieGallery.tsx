import { useEffect, useMemo, useRef, useState } from "react"
import type { MakerHoggie } from "../hoggies.ts"
import { CloseIcon, SparkleIcon } from "./icons.tsx"

/** Hoggie names ranked for a search: name, then the package's tags and the hand-kept topics. */
export function rankHoggies(
  names: string[],
  hogs: Record<string, MakerHoggie>,
  query: string,
): string[] {
  const q = query.toLowerCase().trim()
  if (!q) return names
  const words = q.split(/[\s,]+/).filter(Boolean)
  const out: { n: string; s: number }[] = []
  for (const hn of names) {
    const nm = hn.toLowerCase()
    const h = hogs[hn]
    const tags = (h?.tags ?? "").split("|").filter(Boolean)
    const topics = (h?.topics ?? "").split("|").filter(Boolean)
    let score = 0
    if (nm === q) score += 20
    if (tags.includes(q) || topics.includes(q)) score += 10
    for (const w of words) {
      if (` ${nm} `.includes(` ${w} `)) score += 6
      else if (nm.includes(w)) score += 3
      for (const t of topics) if (t === w || t === w.replace(/s$/, "")) score += 5
      for (const t of tags) {
        if (t === w) score += 4
        else if (` ${t} `.includes(` ${w} `)) score += 2
        else if (w.length > 2 && t.includes(w)) score += 1
      }
    }
    if (score > 0) out.push({ n: hn, s: score })
  }
  return out.sort((a, b) => b.s - a.s).map((o) => o.n)
}

/**
 * The hoggie picker: a searchable grid of every hoggie the maker offers. `selected` null means
 * the automatic choice, which gets its own tile when `autoLabel` is given.
 */
export function HoggieGallery({
  open,
  onClose,
  hogs,
  names,
  selected,
  autoLabel,
  placeholder = "Search: sql, experiments, coffee, wizard…",
  onPick,
}: {
  open: boolean
  onClose: () => void
  hogs: Record<string, MakerHoggie>
  /** The hoggies to offer, in order (default: all of them). */
  names?: string[]
  selected: string | null
  autoLabel?: string
  /** The search box's example words (default: blog subjects). */
  placeholder?: string
  /** A hoggie's name, or null for the automatic choice. */
  onPick: (name: string | null) => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const search = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState("")

  useEffect(() => {
    const d = dialog.current
    if (!d) return
    if (open && !d.open) {
      setQuery("")
      d.showModal()
      search.current?.focus()
    } else if (!open && d.open) d.close()
  }, [open])

  const all = useMemo(() => names ?? Object.keys(hogs), [names, hogs])
  const list = useMemo(() => rankHoggies(all, hogs, query), [all, hogs, query])
  const searching = !!query.trim()
  const pick = (name: string | null) => {
    onPick(name)
    onClose()
  }

  return (
    <dialog
      className="gallery"
      ref={dialog}
      aria-label="Choose a hoggie"
      onClose={onClose}
      // A click on the backdrop lands on the dialog itself.
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="g-wrap">
        <div className="g-head">
          <div className="g-title">
            <h2>Choose a hoggie</h2>
            <button className="icon-btn" type="button" aria-label="Close" onClick={onClose}>
              <CloseIcon />
            </button>
          </div>
          <div className="g-search">
            <input
              ref={search}
              className="input"
              type="search"
              aria-label="Search hoggies"
              placeholder={placeholder}
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <span className="g-count">
              {searching
                ? list.length
                  ? `${list.length} ${list.length === 1 ? "match" : "matches"}, best first`
                  : "No matches. Try another word."
                : `${list.length} hoggies`}
            </span>
          </div>
        </div>
        <div className="g-grid">
          {autoLabel && !searching ? (
            <button
              type="button"
              className="g-item auto"
              aria-pressed={selected === null}
              onClick={() => pick(null)}
            >
              <span className="auto-mark">
                <SparkleIcon />
              </span>
              <span>{autoLabel}</span>
            </button>
          ) : null}
          {open
            ? list.map((name) => (
                <button
                  key={name}
                  type="button"
                  className="g-item"
                  aria-pressed={selected === name}
                  onClick={() => pick(name)}
                >
                  <img loading="lazy" src={hogs[name]?.id} alt="" />
                  <span>{name}</span>
                </button>
              ))
            : null}
        </div>
      </div>
    </dialog>
  )
}
