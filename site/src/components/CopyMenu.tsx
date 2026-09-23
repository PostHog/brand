import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react"
import { createPortal } from "react-dom"
import type { SvgLoader } from "../assets-hoggies.ts"
import { canWriteType, copyRich, copyToClipboard, fetchPng } from "../clipboard.ts"

/** Everything an asset can be copied as. */
export interface CopyTarget {
  /** The `import { … } from "@posthog/brand/…"` line. */
  importLine: string
  /** A JSX snippet for this exact rendering; when set, the menu offers "Copy JSX". */
  usage?: string
  /**
   * The PNG: a bundled URL, or a function producing the blob (e.g. rasterizing on demand).
   * When absent the PNG options are unavailable.
   */
  png?: string | (() => Promise<Blob>)
  /** Lazily loads the SVG markup. */
  svg: SvgLoader
}

/** Transient feedback after a copy: what was copied, or that it failed. */
export interface CopyStatus {
  ok: boolean
  label: string
}

interface MenuItem {
  label: string
  /** Why the item is disabled; when set, the item is disabled. */
  unavailable?: string
  run: () => void
}

/**
 * Click-to-copy plus a right-click menu of formats for one asset.
 *
 * A plain click copies the PNG — the thing most people want to paste into Slack, Figma or
 * Docs. It's `image/png` alone on purpose: an item that also carries the import line as
 * `text/plain` gets pasted as *both* by Slack (image attached, text in the message box). The
 * context menu (right-click, Shift+F10, or the Menu key) picks one format explicitly,
 * including the import line. Spread `onClick`/`onContextMenu` onto the trigger, render `menu`, and
 * show `status` however suits the trigger.
 */
export function useAssetCopy(target: CopyTarget): {
  status: CopyStatus | null
  onClick: () => void
  onContextMenu: (e: MouseEvent<HTMLElement>) => void
  menu: ReactNode
} {
  const [status, setStatus] = useState<CopyStatus | null>(null)
  const [menuAt, setMenuAt] = useState<{ x: number; y: number } | null>(null)
  const trigger = useRef<HTMLElement | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  // Each copy must reach `navigator.clipboard` synchronously inside the gesture (Safari), so
  // the copies below are started straight from the handlers and only their result awaited.
  // Each resolves to the label to flash, or `false` when nothing landed on the clipboard.
  function report(done: Promise<string | false>) {
    void done
      .catch(() => false as const)
      .then((label) => {
        setStatus(label ? { ok: true, label } : { ok: false, label: "Couldn't copy" })
        clearTimeout(timer.current)
        timer.current = setTimeout(() => setStatus(null), 1400)
      })
  }

  const { importLine, usage, png, svg } = target
  const as = (label: string) => (ok: boolean) => ok && label

  function copyImport(): Promise<string | false> {
    return copyToClipboard(importLine).then(as("Import copied"))
  }

  function copyPng(): Promise<string | false> {
    const blob = typeof png === "string" ? fetchPng(png) : png!()
    return copyRich({ "image/png": blob }).then(as("PNG copied"))
  }

  /** The click: the PNG, or — where images can't go on the clipboard — the import line. */
  function copyDefault(): Promise<string | false> {
    return png && canWriteType("image/png") ? copyPng() : copyImport()
  }

  function copySvgText(): Promise<string | false> {
    return copyRich({ "text/plain": svg() })
      .then((ok) => ok || svg().then(copyToClipboard))
      .then(as("SVG copied"))
  }

  const items: MenuItem[] = [
    {
      label: "Copy import statement",
      run: () => report(copyImport()),
    },
    ...(usage
      ? [
          {
            label: "Copy JSX",
            run: () => report(copyToClipboard(usage).then(as("JSX copied"))),
          },
        ]
      : []),
    {
      label: "Copy SVG as text",
      run: () => report(copySvgText()),
    },
    {
      label: "Copy SVG as image",
      unavailable: canWriteType("image/svg+xml")
        ? undefined
        : "This browser can't put SVG images on the clipboard",
      run: () => report(copyRich({ "image/svg+xml": svg() }).then(as("SVG image copied"))),
    },
    {
      label: "Copy PNG",
      unavailable: !png
        ? "No PNG for this asset"
        : canWriteType("image/png")
          ? undefined
          : "This browser can't put images on the clipboard",
      run: () => report(copyPng()),
    },
  ]

  function onContextMenu(e: MouseEvent<HTMLElement>) {
    e.preventDefault()
    trigger.current = e.currentTarget
    // Keyboard-opened menus (Shift+F10 / Menu key) report no pointer position; anchor
    // those under the trigger instead.
    if (e.clientX === 0 && e.clientY === 0) {
      const r = e.currentTarget.getBoundingClientRect()
      setMenuAt({ x: r.left, y: r.bottom })
    } else {
      setMenuAt({ x: e.clientX, y: e.clientY })
    }
    // Warm the SVG chunk so the SVG options have it by the time one is picked.
    void svg().catch(() => undefined)
  }

  const close = useCallback((restoreFocus: boolean) => {
    setMenuAt(null)
    if (restoreFocus) {
      trigger.current?.focus()
    }
  }, [])

  return {
    status,
    onClick: () => report(copyDefault()),
    onContextMenu,
    menu: menuAt ? <CopyMenu x={menuAt.x} y={menuAt.y} items={items} onClose={close} /> : null,
  }
}

interface CopyMenuProps {
  x: number
  y: number
  items: MenuItem[]
  /** `restoreFocus` is true when the menu was dismissed from the keyboard or an item ran. */
  onClose: (restoreFocus: boolean) => void
}

/** A small fixed-position context menu, kept inside the viewport. */
function CopyMenu({ x, y, items, onClose }: CopyMenuProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ left: x, top: y })

  // Clamp to the viewport before paint, then focus the first usable item.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const { width, height } = el.getBoundingClientRect()
    setPos({
      left: Math.max(8, Math.min(x, window.innerWidth - width - 8)),
      top: Math.max(8, Math.min(y, window.innerHeight - height - 8)),
    })
    el.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus()
  }, [x, y])

  // Dismiss on any outside press, scroll, resize, or the window losing focus.
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose(false)
    }
    const dismiss = () => onClose(false)
    document.addEventListener("pointerdown", onPointerDown, true)
    window.addEventListener("scroll", dismiss, true)
    window.addEventListener("resize", dismiss)
    window.addEventListener("blur", dismiss)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true)
      window.removeEventListener("scroll", dismiss, true)
      window.removeEventListener("resize", dismiss)
      window.removeEventListener("blur", dismiss)
    }
  }, [onClose])

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape" || e.key === "Tab") {
      e.preventDefault()
      onClose(true)
      return
    }
    const buttons = Array.from(
      ref.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? [],
    )
    if (buttons.length === 0) return
    const i = buttons.indexOf(document.activeElement as HTMLButtonElement)
    const next =
      e.key === "ArrowDown"
        ? (i + 1) % buttons.length
        : e.key === "ArrowUp"
          ? (i - 1 + buttons.length) % buttons.length
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? buttons.length - 1
              : -1
    if (next !== -1) {
      e.preventDefault()
      buttons[next].focus()
    }
  }

  return createPortal(
    <div
      ref={ref}
      className="copy-menu"
      role="menu"
      style={pos}
      onKeyDown={onKeyDown}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          role="menuitem"
          disabled={!!item.unavailable}
          title={item.unavailable}
          onClick={() => {
            item.run()
            onClose(true)
          }}
        >
          {item.label}
        </button>
      ))}
    </div>,
    document.body,
  )
}
