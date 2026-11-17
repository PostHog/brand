import posthog from "posthog-js"
import { useCallback, useId, useMemo, useRef, useState } from "react"
import { copyToClipboard } from "../../clipboard.ts"
import { useDismiss } from "../../useDismiss.ts"
import { CheckIcon, ShareIcon } from "./icons.tsx"
import { type Doc, encodeImage, hasUploads } from "./link.ts"

/** The link that opens a copy of `image`: this maker's page with the image's `?image=`. */
function shareUrl(image: Doc): string {
  const url = new URL(window.location.pathname, window.location.origin)
  url.searchParams.set("image", encodeImage(image))
  return url.href
}

const canShareNatively = () => typeof navigator !== "undefined" && "share" in navigator

/**
 * The heading's Share button. One click copies the link to the image being edited and opens a
 * panel that says so, shows the link (to select by hand if copying was blocked), says what the
 * link does and doesn't carry, and offers the system share sheet where there is one.
 *
 * The link is built from the image itself rather than read from the address bar, which only
 * catches up a moment after each edit, so it's never a keystroke behind.
 */
export function ShareButton({ slug, image, name }: { slug: string; image: Doc; name: string }) {
  const [open, setOpen] = useState(false)
  // The link that last made it to the clipboard, and whether the last try failed.
  const [copied, setCopied] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const panelId = useId()

  const url = useMemo(() => shareUrl(image), [image])
  const uploads = useMemo(() => hasUploads(image), [image])
  const close = useCallback(() => setOpen(false), [])
  useDismiss(open, close, root, button)

  const copy = (via: "share button" | "copy button") => {
    // Called straight from the click, so the clipboard write happens inside the gesture
    // (Safari refuses it otherwise).
    void copyToClipboard(url).then((ok) => {
      setFailed(!ok)
      if (ok) {
        setCopied(url)
        posthog.capture("image link copied", { format: slug, via })
      } else {
        // Leave the link selected, so ⌘C / Ctrl+C is all it takes.
        input.current?.focus()
        input.current?.select()
      }
    })
  }

  const nativeShare = () => {
    navigator.share({ title: name, url }).then(
      () => posthog.capture("image link shared", { format: slug }),
      () => {}, // Dismissed the sheet: nothing to do.
    )
  }

  const status = failed
    ? "Couldn’t copy it automatically. The link is selected above, so copy it from there."
    : copied === url
      ? "Link copied."
      : copied
        ? "You’ve edited the image since, so copy the link again to include the changes."
        : null

  return (
    <div className="share" ref={root}>
      <button
        ref={button}
        className="btn"
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          if (open) return setOpen(false)
          setOpen(true)
          copy("share button")
        }}
      >
        <ShareIcon />
        Share
      </button>
      <div
        className="share-panel"
        id={panelId}
        role="dialog"
        aria-label="Share this image"
        hidden={!open}
      >
        <p className="share-title">Share this image</p>
        <div className="share-row">
          <input
            ref={input}
            className="input"
            type="text"
            readOnly
            aria-label="Link to this image"
            value={url}
            onFocus={(e) => e.currentTarget.select()}
          />
          <button className="btn btn-sm" type="button" onClick={() => copy("copy button")}>
            {copied === url ? (
              <>
                <CheckIcon />
                Copied
              </>
            ) : (
              "Copy"
            )}
          </button>
        </div>
        <p className={failed ? "share-status warn" : "share-status"} aria-live="polite">
          {status}
        </p>
        <p className="hint">
          Whoever opens the link gets their own copy to edit. It doesn’t change yours.
        </p>
        {uploads ? (
          <p className="hint warn">
            Pictures you uploaded stay in this browser, so the link doesn’t include them. To share
            the finished image, download the PNG.
          </p>
        ) : null}
        {canShareNatively() ? (
          <button className="btn btn-sm share-native" type="button" onClick={nativeShare}>
            <ShareIcon />
            More ways to share…
          </button>
        ) : null}
      </div>
    </div>
  )
}
