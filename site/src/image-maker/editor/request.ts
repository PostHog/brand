// What an agent (or a script) asks a maker for: a plain JSON object of settings, the same keys
// whether it arrives as a `#new-<hex JSON>` link or as a WebMCP tool's input (webmcp.ts). Each
// maker turns one into a document with its `fromRequest` (model.ts); these are the shared parts.

export type Request = Record<string, unknown>

/** A string setting, trimmed and capped; anything else is "". */
export function str(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : ""
}

/** One of a fixed set of values, or undefined. */
export function oneOf<T extends string>(value: unknown, options: readonly T[]): T | undefined {
  return typeof value === "string" && (options as readonly string[]).includes(value)
    ? (value as T)
    : undefined
}

/** `author` (one name) or `authors` (a list), as up to `max` names. */
export function names(r: Request, max: number): string[] {
  const list = Array.isArray(r.authors) ? r.authors : [r.author]
  return list
    .map((name) => str(name, 120))
    .filter(Boolean)
    .slice(0, max)
}

/**
 * A picture the drawing can load and still export: an https URL (its server must allow
 * cross-origin use, as res.cloudinary.com does), a `data:image/…` URL, or a path on this site
 * ("/logo/…", "/hoggies/…"). Anything else is "".
 */
export function pictureUrl(value: unknown): string {
  if (typeof value !== "string") return ""
  const url = value.trim()
  if (/^data:image\/[a-z+.-]+[;,]/i.test(url)) return url
  if (url.startsWith("/") && !url.startsWith("//")) return url
  return /^https:\/\/[^\s]+$/i.test(url) && url.length <= 2000 ? url : ""
}

/** The last path segment of a URL without its extension, as a picture's display name. */
export function pictureName(url: string, fallback: string): string {
  if (url.startsWith("data:")) return fallback
  const last = url.split(/[?#]/)[0]!.split("/").pop() ?? ""
  return decodeURIComponent(last).replace(/\.[a-z0-9]+$/i, "") || fallback
}

function hashStr(s: string): string {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
  return `${(h >>> 0).toString(36)}-${s.length.toString(36)}`
}

/**
 * The request a `#new-<hex>` hash carries (hex-encoded UTF-8 JSON), with a key that's the same
 * for the same link, so opening it twice finds the image it made instead of making a copy.
 */
export function readHashRequest(hash: string): { request: Request; linkKey: string } | null {
  const m = /^#new-([0-9a-fA-F]+)$/.exec(hash || "")
  if (!m || m[1]!.length % 2) return null
  try {
    const hex = m[1]!.toLowerCase()
    const bytes = new Uint8Array(hex.length / 2)
    for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as unknown
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null
    return { request: parsed as Request, linkKey: hashStr(hex) }
  } catch {
    return null
  }
}

/** Where a maker draws its hoggie: size in percent, moves in its own slider units. */
export interface HoggiePlacement {
  hogSize: number
  hogX: number
  hogY: number
  flip: boolean
}

/** Whether a request places the hoggie itself (any of hoggieSize, hoggieX, hoggieY). */
export function placesHoggie(r: Request): boolean {
  return [r.hoggieSize, r.hoggieX, r.hoggieY].some((v) => typeof v === "number")
}

/**
 * Applies a request's hoggieSize, hoggieX, hoggieY and flip to a document, clamped to the
 * maker's own slider ranges (the same ones its drawing clamps to).
 */
export function placeHoggie(
  d: HoggiePlacement,
  r: Request,
  size: readonly [number, number],
  move: number,
): void {
  const num = (v: unknown, lo: number, hi: number) =>
    typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : undefined
  d.hogSize = num(r.hoggieSize, size[0], size[1]) ?? d.hogSize
  d.hogX = num(r.hoggieX, -move, move) ?? d.hogX
  d.hogY = num(r.hoggieY, -move, move) ?? d.hogY
  if (typeof r.flip === "boolean") d.flip = r.flip
}
