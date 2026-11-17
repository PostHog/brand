// The `?image=` link: an image's settings as base64url JSON, so the link is the save. Uploads are
// object URLs that only live in this tab, so they're left out of the link (and out of storage).

export type Doc = Record<string, unknown>

/** Drops uploaded-file references (object URLs) anywhere in a document. */
export function withoutUploads(value: unknown): unknown {
  if (typeof value === "string") return value.startsWith("blob:") ? undefined : value
  if (Array.isArray(value)) return value.map(withoutUploads).filter((v) => v !== undefined)
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      const next = withoutUploads(v)
      if (next !== undefined) out[k] = next
    }
    // An upload record ({ id: "blob:…", name }) without its file is just noise.
    if ("name" in out && !("id" in out) && "id" in (value as Record<string, unknown>))
      return undefined
    return out
  }
  return value
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let bin = ""
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function fromBase64Url(text: string): string {
  const bin = atob(text.replace(/-/g, "+").replace(/_/g, "/"))
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))
}

/** The `?image=` value for a document: its settings without timestamps or uploads. */
export function encodeImage(doc: Doc): string {
  const { createdAt: _c, updatedAt: _u, linkKey: _l, ...rest } = doc
  return toBase64Url(JSON.stringify(withoutUploads(rest)))
}

export function decodeImage(param: string | null): Doc | null {
  if (!param) return null
  try {
    const parsed = JSON.parse(fromBase64Url(param)) as unknown
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Doc) : null
  } catch {
    return null
  }
}

/** A stable id for an image opened from a link, so the same link maps to the same list entry. */
export function linkId(param: string): string {
  let h = 5381
  for (let i = 0; i < param.length; i++) h = ((h << 5) + h + param.charCodeAt(i)) | 0
  return `link_${(h >>> 0).toString(36)}`
}

export function readImageParam(): string | null {
  return new URLSearchParams(window.location.search).get("image")
}

/** Points the address bar at a document (or clears the parameter), without a navigation. */
export function writeImageParam(doc: Doc | null) {
  const url = new URL(window.location.href)
  if (doc) url.searchParams.set("image", encodeImage(doc))
  else url.searchParams.delete("image")
  if (url.href !== window.location.href) window.history.replaceState(window.history.state, "", url)
}
