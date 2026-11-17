import { type ReactNode, useCallback, useId, useRef, useState } from "react"
import { useDismiss } from "../useDismiss.ts"

/**
 * A top-nav group: a button that opens a panel of links (the disclosure pattern, not an ARIA
 * menu, since the items are plain links). It closes on a click outside, Escape (focus goes back
 * to the button), focus leaving it, or following one of its links.
 */
export function NavMenu({
  label,
  active,
  onWarm,
  children,
}: {
  label: string
  /** Whether the current page is one of the group's, so the button shows as the active item. */
  active: boolean
  /** Called on hover/focus of the button, to start loading the group's route chunks. */
  onWarm?: () => void
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  const close = useCallback(() => setOpen(false), [])
  useDismiss(open, close, root, button)

  return (
    <div
      className="nav-menu"
      ref={root}
      onBlur={(e) => {
        if (!root.current?.contains(e.relatedTarget as Node | null)) setOpen(false)
      }}
    >
      <button
        ref={button}
        type="button"
        className={active ? "nav-menu-button active" : "nav-menu-button"}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={onWarm}
        onFocus={onWarm}
      >
        {label}
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      <div
        className="nav-menu-panel"
        id={panelId}
        hidden={!open}
        onClick={(e) => {
          if ((e.target as Element).closest("a")) setOpen(false)
        }}
      >
        {children}
      </div>
    </div>
  )
}
