/**
 * Copies `text`, resolving to whether it worked.
 *
 * `navigator.clipboard` only exists in a secure context, so it is `undefined` when the
 * site is served over plain http (an IP-address preview, say), so reaching straight for
 * `.writeText` throws there. Even where it exists the promise can reject (denied
 * permission, an unfocused document), so callers get a boolean and only show "Copied!"
 * when the text really landed on the clipboard.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!navigator.clipboard?.writeText) {
    return false
  }
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

/** MIME type → its payload, or a promise of it (resolved lazily by the browser). */
export type ClipboardPayload = Record<string, string | Blob | Promise<string | Blob>>

/** The types every async-clipboard implementation must accept, per the spec. */
const MANDATORY_TYPES = ["text/plain", "text/html", "image/png"]

/** Whether this browser can put `type` on the clipboard via `navigator.clipboard.write`. */
export function canWriteType(type: string): boolean {
  if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) {
    return false
  }
  // `ClipboardItem.supports` is newer than `ClipboardItem` itself; without it, assume only
  // the mandatory types (e.g. `image/svg+xml` needs a recent Chromium).
  return typeof ClipboardItem.supports === "function"
    ? ClipboardItem.supports(type)
    : MANDATORY_TYPES.includes(type)
}

/**
 * Writes one clipboard item carrying several representations at once — say an import line
 * as `text/plain` and the artwork as `image/png` — so each app pastes the flavor it
 * understands (an editor gets the text, Slack or Figma the image). Resolves to whether it
 * worked; types this browser can't write are dropped.
 *
 * Payloads may be promises. Safari only allows a clipboard write *synchronously* inside
 * the user gesture, so slow work (fetching a PNG, lazy-loading an SVG chunk) must be handed
 * over as a promise rather than awaited first — callers must call this straight from the
 * event handler.
 */
export async function copyRich(payload: ClipboardPayload): Promise<boolean> {
  // A payload we drop (or a write we never make) must not surface as an unhandled rejection;
  // a rejection that matters still fails the `write` below.
  for (const value of Object.values(payload)) {
    if (value instanceof Promise) value.catch(() => undefined)
  }
  const entries = Object.entries(payload).filter(([type]) => canWriteType(type))
  if (entries.length === 0) {
    return false
  }
  const item = new ClipboardItem(
    Object.fromEntries(
      entries.map(([type, value]) => [
        type,
        Promise.resolve(value).then((v) => (typeof v === "string" ? new Blob([v], { type }) : v)),
      ]),
    ),
  )
  try {
    await navigator.clipboard.write([item])
    return true
  } catch {
    return false
  }
}

/** Fetches a PNG URL (or data URI) as an `image/png` blob for the clipboard. */
export async function fetchPng(url: string): Promise<Blob> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`)
  }
  const blob = await res.blob()
  // The clipboard rejects a blob whose type doesn't match its key exactly.
  return blob.type === "image/png" ? blob : new Blob([blob], { type: "image/png" })
}
