// The images a maker keeps: this browser's localStorage (the list on the left) plus the page link.
// Every edit is saved after a short pause, and the address bar's `?image=` always describes the
// image being edited, so copying the link shares it and opening the link restores it.

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  type Doc,
  decodeImage,
  encodeImage,
  linkId,
  readImageParam,
  withoutUploads,
  writeImageParam,
} from "./link.ts"

/** What every maker's document carries besides its own settings. */
export interface Stamped {
  createdAt: number
  updatedAt: number
  /** Set on images made from a `#new-…` link, so opening the link again finds the image. */
  linkKey?: string
}

export interface Item<D> {
  id: string
  data: D
}

const RECENT_LIMIT = 40
const SAVE_DELAY_MS = 450

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

export function newId(): string {
  return `img_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

/** A deep copy through JSON, which is all a document ever holds. */
export function cloneDoc<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

interface State<D> {
  items: Item<D>[]
  currentId: string
  /** The starter image shown when nothing is saved yet. It's saved once it's edited. */
  sampleId: string | null
}

function initialState<D extends Stamped>(maker: string, blank: () => D): State<D> {
  const store = readStore(maker)
  // Uploads are object URLs from an earlier visit, which are gone now.
  const restore = (raw: Doc): D => ({ ...blank(), ...(withoutUploads(raw) as Doc) }) as D

  let openId: string | null = null
  const param = readImageParam()
  const linked = decodeImage(param)
  if (linked && param) {
    // A link to an image already in the list opens that image instead of adding a copy.
    openId = Object.keys(store).find((id) => encodeImage(store[id]!) === param) ?? null
    if (!openId) {
      openId = linkId(param)
      const now = Date.now()
      store[openId] = { ...linked, createdAt: now, updatedAt: now }
      writeStore(maker, store)
    }
  }

  const items = Object.keys(store)
    .sort((a, b) => {
      if (a === openId) return -1
      if (b === openId) return 1
      return Number(store[b]?.createdAt ?? 0) - Number(store[a]?.createdAt ?? 0)
    })
    .map((id) => ({ id, data: restore(store[id]!) }))

  if (!items.length) {
    const sample = { id: newId(), data: blank() }
    return { items: [sample], currentId: sample.id, sampleId: sample.id }
  }
  return { items, currentId: items[0]!.id, sampleId: null }
}

export interface ImageStore<D> {
  items: Item<D>[]
  current: Item<D>
  select: (id: string) => void
  /** Merges a patch (or the patch a function returns) into the current image and saves it. */
  edit: (patch: Partial<D> | ((data: D) => Partial<D>)) => void
  /** Adds an image at the top of the list and opens it. An untouched starter image makes way. */
  add: (data: D) => void
  duplicate: () => void
  remove: () => void
  /** One line of feedback beside the image's name: saving, downloads, upload problems. */
  status: string
  setStatus: (status: string) => void
}

export function useImageStore<D extends Stamped>(maker: string, blank: () => D): ImageStore<D> {
  const [state, setState] = useState<State<D>>(() => initialState(maker, blank))
  const [status, setStatus] = useState("")

  // Every change goes through `commit`, which updates this ref at once (not on the next render),
  // so changes made in the same tick build on each other and a pending save always finds its
  // image, even while the editor mounts.
  const latest = useRef(state)
  const commit = useCallback((next: State<D>) => {
    latest.current = next
    setState(next)
  }, [])
  const timers = useRef(new Map<string, number>())

  const save = useCallback(
    (id: string) => {
      window.clearTimeout(timers.current.get(id))
      setStatus("Saving…")
      timers.current.set(
        id,
        window.setTimeout(() => {
          timers.current.delete(id)
          const item = latest.current.items.find((it) => it.id === id)
          if (!item) return
          const store = readStore(maker)
          store[id] = cloneDoc(item.data) as unknown as Doc
          writeStore(maker, store)
          setStatus("All changes saved")
        }, SAVE_DELAY_MS),
      )
    },
    [maker],
  )

  // Flush pending saves when the maker closes, so the last keystrokes aren't lost.
  useEffect(() => {
    const pending = timers.current
    return () => {
      if (!pending.size) return
      const store = readStore(maker)
      for (const [id, timer] of pending) {
        window.clearTimeout(timer)
        const item = latest.current.items.find((it) => it.id === id)
        if (item) store[id] = cloneDoc(item.data) as unknown as Doc
      }
      writeStore(maker, store)
      pending.clear()
    }
  }, [maker])

  const select = useCallback(
    (id: string) => {
      const s = latest.current
      if (s.items.some((it) => it.id === id)) commit({ ...s, currentId: id })
    },
    [commit],
  )

  const edit = useCallback(
    (patch: Partial<D> | ((data: D) => Partial<D>)) => {
      const s = latest.current
      const id = s.currentId
      commit({
        ...s,
        sampleId: s.sampleId === id ? null : s.sampleId,
        items: s.items.map((it) => {
          if (it.id !== id) return it
          const next = typeof patch === "function" ? patch(it.data) : patch
          return { id, data: { ...it.data, ...next, updatedAt: Date.now() } }
        }),
      })
      save(id)
    },
    [commit, save],
  )

  const add = useCallback(
    (data: D) => {
      const s = latest.current
      const item = { id: newId(), data }
      commit({
        items: [item, ...s.items.filter((it) => it.id !== s.sampleId)],
        currentId: item.id,
        sampleId: null,
      })
      save(item.id)
    },
    [commit, save],
  )

  const duplicate = useCallback(() => {
    const cur = latest.current.items.find((it) => it.id === latest.current.currentId)
    if (!cur) return
    const now = Date.now()
    const { linkKey: _drop, ...data } = cloneDoc(cur.data)
    add({ ...data, createdAt: now, updatedAt: now } as D)
  }, [add])

  const remove = useCallback(() => {
    const { items, currentId } = latest.current
    const idx = items.findIndex((it) => it.id === currentId)
    if (idx < 0) return
    window.clearTimeout(timers.current.get(currentId))
    timers.current.delete(currentId)
    const store = readStore(maker)
    delete store[currentId]
    writeStore(maker, store)
    const rest = items.filter((it) => it.id !== currentId)
    if (!rest.length) {
      const sample = { id: newId(), data: blank() }
      commit({ items: [sample], currentId: sample.id, sampleId: sample.id })
    } else {
      commit({ items: rest, currentId: rest[Math.min(idx, rest.length - 1)]!.id, sampleId: null })
    }
    setStatus("Image deleted")
  }, [maker, blank, commit])

  // Images handed over by the WebMCP tools (`openInMaker`): queued until this maker is open.
  useEffect(() => {
    const drain = () => {
      const docs = handedOver.get(maker)
      if (!docs) return
      handedOver.delete(maker)
      for (const doc of docs) add({ ...blank(), ...doc } as D)
      setStatus(docs.length > 1 ? `${docs.length} images made by an agent` : "Made by an agent")
    }
    drain()
    window.addEventListener(HANDOVER_EVENT, drain)
    return () => window.removeEventListener(HANDOVER_EVENT, drain)
  }, [maker, blank, add])

  const current = useMemo(
    () => state.items.find((it) => it.id === state.currentId) ?? state.items[0]!,
    [state.items, state.currentId],
  )

  // Keep the address bar on the image being edited (the starter image has no link until it's
  // edited). Debounced like saving, since browsers throttle history updates.
  const isSample = state.sampleId === current.id
  useEffect(() => {
    const timer = window.setTimeout(
      () => writeImageParam(isSample ? null : (current.data as unknown as Doc)),
      SAVE_DELAY_MS,
    )
    return () => window.clearTimeout(timer)
  }, [current, isSample])

  return { items: state.items, current, select, edit, add, duplicate, remove, status, setStatus }
}

// ---- Images made elsewhere: `#new-…` links and agents ----

const HANDOVER_EVENT = "brand-image-maker:handover"
const handedOver = new Map<string, Doc[]>()

/**
 * Adds an image to a maker's list and opens it: at once if the maker is on screen, else when it
 * next opens (the caller navigates there). Used by the WebMCP tools.
 */
export function openInMaker(maker: string, doc: Doc) {
  handedOver.set(maker, [...(handedOver.get(maker) ?? []), cloneDoc(doc)])
  window.dispatchEvent(new Event(HANDOVER_EVENT))
}

/**
 * Makes an image from a `#new-<hex JSON>` link when the page opens (or the hash changes), or
 * opens the one the same link made before. `read` is the maker's `readLinkRequest`.
 */
export function useNewImageLinks<D extends Stamped>(
  store: ImageStore<D>,
  read: (hash: string) => D | null,
  label: (data: D) => string,
) {
  const { add, select, setStatus } = store
  const items = useRef(store.items)
  items.current = store.items
  const labelRef = useRef(label)
  labelRef.current = label
  useEffect(() => {
    const apply = () => {
      const req = read(window.location.hash)
      if (!req) return
      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname + window.location.search,
      )
      const existing = items.current.find((it) => it.data.linkKey === req.linkKey)
      if (existing) {
        select(existing.id)
        setStatus("Opened the image made from this link")
      } else {
        add(req)
        setStatus(`Made from link: ${labelRef.current(req)}`)
      }
    }
    apply()
    window.addEventListener("hashchange", apply)
    return () => window.removeEventListener("hashchange", apply)
  }, [read, add, select, setStatus])
}
