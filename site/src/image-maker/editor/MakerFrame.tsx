import { type ReactNode, memo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { PaintedCanvas } from "./PaintedCanvas.tsx"
import { PlusIcon } from "./icons.tsx"
import type { Doc } from "./link.ts"
import { ShareButton } from "./Share.tsx"
import type { Item } from "./store.ts"
import "../maker.css"

// The editor every maker shares: a heading with the download buttons across the top, then the
// image list, the stage and the settings panel. A maker fills in the stage and the settings.

export function MakerFrame({
  slug,
  engine,
  title,
  lede,
  docName,
  image,
  status,
  downloads,
  list,
  stage,
  settings,
  children,
}: {
  /** The maker's URL segment, for analytics. */
  slug: string
  /** The CSS scope (`.mk-<engine>`) for this maker's own rules in maker.css. */
  engine: string
  title: string
  lede: ReactNode
  docName: string
  /** The image being edited, for its Share link. */
  image: object
  status: string
  downloads: ReactNode
  list: ReactNode
  stage: ReactNode
  settings: ReactNode
  /** Dialogs and other things outside the grid. */
  children?: ReactNode
}) {
  return (
    <div className={`mk mk-${engine}`}>
      <div className="main">
        <div className="maker-head">
          <div className="mh-text page-header">
            <Link className="eyebrow" to="/tools/images" title="All image makers">
              image makers
            </Link>
            <h1>{title}</h1>
            <p className="mh-desc">{lede}</p>
          </div>
          <div className="mh-side">
            <div className="dl">
              <ShareButton slug={slug} image={image as Doc} name={docName} />
              {downloads}
            </div>
            <div className="mh-status">
              <span className="doc-name">{docName}</span>
              <span className="save-state" aria-live="polite">
                {status}
              </span>
            </div>
          </div>
        </div>
        {list}
        <main className="stage">{stage}</main>
        <aside className="props" aria-label="Image settings">
          {settings}
        </aside>
      </div>
      {children}
    </div>
  )
}

export interface ThumbSpec {
  width: number
  height: number
  paint: (ctx: CanvasRenderingContext2D) => void
}

export function ImageList<D>({
  label,
  items,
  currentId,
  onSelect,
  onNew,
  thumb,
  title,
  byline,
  notice,
}: {
  /** The list's accessible name, e.g. "Blog images". */
  label: string
  items: Item<D>[]
  currentId: string
  onSelect: (id: string) => void
  onNew: () => void
  /** How to draw an image's thumbnail. Keep it a stable function (module scope or useCallback). */
  thumb: (data: D) => ThumbSpec
  title: (data: D) => string
  byline: (data: D) => string
  notice?: ReactNode
}) {
  return (
    <nav className="list" aria-label={label}>
      <div className="list-head">
        <button className="btn new-btn" type="button" onClick={onNew}>
          <PlusIcon />
          New image
        </button>
        <span className="list-label">{items.length ? `Images (${items.length})` : "Images"}</span>
      </div>
      {notice ? <div className="notice">{notice}</div> : null}
      <ol className="thumbs">
        {items.map((it, i) => (
          <Thumb
            key={it.id}
            id={it.id}
            n={i + 1}
            data={it.data}
            current={it.id === currentId}
            onSelect={onSelect}
            thumb={thumb}
            title={title}
            byline={byline}
          />
        ))}
      </ol>
    </nav>
  )
}

// Memoized so typing in one image doesn't repaint every thumbnail in the list.
const Thumb = memo(function Thumb<D>({
  id,
  n,
  data,
  current,
  onSelect,
  thumb,
  title,
  byline,
}: {
  id: string
  n: number
  data: D
  current: boolean
  onSelect: (id: string) => void
  thumb: (data: D) => ThumbSpec
  title: (data: D) => string
  byline: (data: D) => string
}) {
  const spec = thumb(data)
  return (
    <li>
      <button className="thumb" type="button" aria-current={current} onClick={() => onSelect(id)}>
        <span className="num">{n}</span>
        <span>
          <PaintedCanvas width={spec.width} height={spec.height} paint={spec.paint} aria-hidden />
          <span className="meta">
            <span className="t">{title(data)}</span>
            <span className="d">{byline(data)}</span>
          </span>
        </span>
      </button>
    </li>
  )
}) as <D>(props: {
  id: string
  n: number
  data: D
  current: boolean
  onSelect: (id: string) => void
  thumb: (data: D) => ThumbSpec
  title: (data: D) => string
  byline: (data: D) => string
}) => ReactNode

/** Duplicate and Delete, with a confirmation step before deleting. */
export function ImageActions({
  onDuplicate,
  onDelete,
}: {
  onDuplicate: () => void
  onDelete: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  return (
    <section className="mk-section">
      <h2>This image</h2>
      <div className="actions">
        {confirming ? (
          <>
            <button
              className="btn btn-sm danger"
              type="button"
              onClick={() => {
                setConfirming(false)
                onDelete()
              }}
            >
              Yes, delete this image
            </button>
            <button
              className="btn btn-sm"
              type="button"
              autoFocus
              onClick={() => setConfirming(false)}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-sm" type="button" onClick={onDuplicate}>
              Duplicate
            </button>
            <button className="btn btn-sm danger" type="button" onClick={() => setConfirming(true)}>
              Delete
            </button>
          </>
        )}
      </div>
    </section>
  )
}

/** A hidden file input for image uploads, opened from any button or from the stage. */
export function useImagePicker(onImage: (file: File) => void, onWrongType: () => void) {
  const input = useRef<HTMLInputElement>(null)
  const element = (
    <input
      ref={input}
      type="file"
      accept="image/*"
      hidden
      onChange={(e) => {
        const file = e.target.files?.[0]
        e.target.value = ""
        if (!file) return
        if (!file.type.startsWith("image/")) onWrongType()
        else onImage(file)
      }}
    />
  )
  return { open: () => input.current?.click(), element }
}
