// The services each maker asks for with `env.host.use(name)`, on this static site:
//   • db        → this browser's localStorage (the "Images" list on the left is the images you
//                 made here), plus the page link: every edit rewrites `?image=` with the current
//                 image's settings, so the link is the save and opening it restores the image.
//   • assets    → uploads stay in the browser (object URLs). They draw and download fine, but
//                 a link can't carry them, so they're dropped from `?image=`.
//   • downloads → a plain <a download>.

type Doc = Record<string, unknown>

export interface MakerHost {
  use: (name: string) => Promise<unknown>
  /** Stop listening and release object URLs. */
  dispose: () => void
}

const RECENT_LIMIT = 40

function storageKey(maker: string) {
  return `brand-image-maker:${maker}`
}

function readStore(maker: string): Record<string, Doc> {
  try {
    const raw = window.localStorage.getItem(storageKey(maker))
    const parsed = raw ? (JSON.parse(raw) as unknown) : null
    return parsed && typeof parsed === "object" ? (parsed as Record<string, Doc>) : {}
  } catch {
    return {}
  }
}

function writeStore(maker: string, store: Record<string, Doc>) {
  // Keep the newest images only, so the list (and storage) can't grow without bound.
  const ids = Object.keys(store).sort(
    (a, b) => Number(store[b]?.updatedAt ?? 0) - Number(store[a]?.updatedAt ?? 0),
  )
  const kept: Record<string, Doc> = {}
  for (const id of ids.slice(0, RECENT_LIMIT)) kept[id] = store[id]!
  try {
    window.localStorage.setItem(storageKey(maker), JSON.stringify(kept))
  } catch {
    // Private windows and full storage: the link still saves the image.
  }
}

/** Removes uploaded-file references (object URLs) anywhere in a document. */
function withoutUploads(value: unknown): unknown {
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

function decodeImage(param: string | null): Doc | null {
  if (!param) return null
  try {
    const parsed = JSON.parse(fromBase64Url(param)) as unknown
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Doc) : null
  } catch {
    return null
  }
}

function linkId(param: string): string {
  let h = 5381
  for (let i = 0; i < param.length; i++) h = ((h << 5) + h + param.charCodeAt(i)) | 0
  return `link_${(h >>> 0).toString(36)}`
}

export function createHost(maker: string, onChange?: (doc: Doc) => void): MakerHost {
  const objectUrls: string[] = []
  let disposed = false

  // An image opened from a link joins the list (once: the same link maps to the same id).
  const param = new URLSearchParams(window.location.search).get("image")
  const linked = decodeImage(param)
  const store = readStore(maker)
  if (linked && param) {
    const id = linkId(param)
    const now = Date.now()
    store[id] = { ...store[id], ...linked, createdAt: store[id]?.createdAt ?? now, updatedAt: now }
    writeStore(maker, store)
  }
  const openId = linked && param ? linkId(param) : null

  function setLink(doc: Doc) {
    const url = new URL(window.location.href)
    url.searchParams.set("image", encodeImage(doc))
    window.history.replaceState(window.history.state, "", url)
    onChange?.(doc)
  }

  const db = {
    collection: () => ({
      orderBy: () => ({
        onSnapshot(cb: (snap: { docs: { id: string; data: () => Doc }[] }) => void) {
          const current = readStore(maker)
          const ids = Object.keys(current).sort((a, b) => {
            // The linked image first, then newest first (the makers order by createdAt).
            if (a === openId) return -1
            if (b === openId) return 1
            return Number(current[b]?.createdAt ?? 0) - Number(current[a]?.createdAt ?? 0)
          })
          const docs = ids.map((id) => ({ id, data: () => current[id]! }))
          window.setTimeout(() => {
            if (!disposed) cb({ docs })
          }, 0)
          return () => {}
        },
      }),
    }),
    doc(path: string) {
      const id = path.split("/").pop() ?? path
      return {
        set(data: Doc) {
          if (disposed) return Promise.resolve()
          const s = readStore(maker)
          s[id] = data
          writeStore(maker, s)
          setLink(data)
          return Promise.resolve()
        },
        delete() {
          const s = readStore(maker)
          delete s[id]
          writeStore(maker, s)
          return Promise.resolve()
        },
      }
    },
  }

  const assets = {
    upload(file: Blob) {
      const url = URL.createObjectURL(file)
      objectUrls.push(url)
      return Promise.resolve({ id: url, url, sizeBytes: file.size, contentType: file.type })
    },
  }

  const downloads = {
    save({ filename, data }: { filename: string; data: Blob }) {
      const url = URL.createObjectURL(data)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
      return Promise.resolve()
    },
  }

  return {
    use(name: string) {
      if (name === "db") return Promise.resolve(db)
      if (name === "assets") return Promise.resolve(assets)
      if (name === "downloads") return Promise.resolve(downloads)
      return Promise.resolve(null)
    },
    dispose() {
      disposed = true
      // Uploads are kept for the session so images in the list still draw; the browser frees
      // them when the tab closes.
      void objectUrls
    },
  }
}
