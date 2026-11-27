// The image makers for agents: the make_*_image WebMCP tools (webmcp.ts) run here. A tool's input
// is the same request a `#new-…` link carries (each maker's `fromRequest`); this turns it into a
// document, draws it with the maker's own draw.ts (so it's the image the maker shows and
// downloads), and hands back a preview the agent can look at, the `?image=` link, and what the
// maker decided for it (the hoggie it matched, where the logo came from…). Optionally it opens the
// image in the maker, saved in the user's list, and downloads the PNG.
//
// Loaded on the first call (webmcp.ts imports it lazily), so the site's first load doesn't carry
// the makers.

import { type MakerSlug, makerPath } from "./catalog.ts"
import {
  BOLD,
  MEDIUM,
  type Rect,
  REGULAR,
  SEMIBOLD,
  imageFailed,
  imagesReady,
  requestFonts,
  slugify,
} from "./editor/canvas.ts"
import { downloadPng } from "./editor/download.ts"
import { decodeImage, type Doc, encodeImage, withoutUploads } from "./editor/link.ts"
import { placesHoggie, type Request } from "./editor/request.ts"
import { openInMaker, type Stamped } from "./editor/store.ts"
import { findHoggie } from "./hoggies.ts"
import * as blogDraw from "./makers/blog/draw.ts"
import * as blog from "./makers/blog/model.ts"
import * as buildDraw from "./makers/build/draw.ts"
import * as build from "./makers/build/model.ts"
import * as customerDraw from "./makers/customer/draw.ts"
import * as customer from "./makers/customer/model.ts"
import * as eventDraw from "./makers/event/draw.ts"
import * as event from "./makers/event/model.ts"

/** One file the image comes out as (build mode has four sizes; the others one). */
interface Frame {
  label: string
  width: number
  height: number
  filename: string
  draw: (ctx: CanvasRenderingContext2D) => void
}

interface Engine<D extends Stamped> {
  /** The maker's new document, which a saved one (an `?image=` link) is opened over. */
  blank: () => D
  fromRequest: (r: Request) => D | string
  /** The files, the preview first. `size` picks one where there are several. */
  frames: (d: D, size?: string) => Frame[]
  images: (d: D) => string[]
  /** The width SVGs are rasterized at (it's part of the image cache's key). */
  minWidth?: number
  /** Asks for the font faces the drawing's text needs. */
  fonts: (d: D) => void
  /**
   * Adjusts what the agent left to the maker once the images have loaded (the event hoggie's
   * placement), and says what it changed or what still needs fixing.
   */
  fit?: (d: D, r: Request) => { note?: string; warning?: string }
  /** What the maker decided, and anything the agent should fix. */
  report: (d: D, r: Request) => { facts: Record<string, unknown>; warnings: string[] }
}

const askedHoggie = (r: Request): string => (typeof r.hoggie === "string" ? r.hoggie.trim() : "")

function unknownHoggie(r: Request, fallback: string): string[] {
  const asked = askedHoggie(r)
  return asked && !findHoggie(asked)
    ? [
        `"${asked}" isn't a hoggie the makers have, so ${fallback}. Use search_brand_assets with type "hoggie" to find one.`,
      ]
    : []
}

const blogEngine: Engine<blog.BlogDoc> = {
  blank: blog.blank,
  fromRequest: blog.fromRequest,
  frames: (d) => [
    {
      label: "1920 × 1080",
      width: blog.W,
      height: blog.H,
      filename: `${slugify(blog.plainTitle(d), "blog-image")}.png`,
      draw: (ctx) => void blogDraw.drawPost(ctx, d),
    },
  ],
  images: blogDraw.imagesOf,
  fonts: (d) =>
    requestFonts([REGULAR, MEDIUM, SEMIBOLD, BOLD], d.title + d.sub + blog.authorsOf(d).join("")),
  report: (d, r) => {
    const warnings = unknownHoggie(r, "it matched one to the title")
    if (!blog.highlightIndex(d).found)
      warnings.push(`The highlight "${d.hlText}" isn't in the title, so nothing is highlighted.`)
    return {
      facts: {
        hoggie: blog.resolvedHog(d),
        hoggieChosenBy: blog.isAuto(d) ? "matched to the title and description" : "you",
        authors: blog.authorsOf(d),
        color: d.color,
        tone: d.seo ? "light" : d.tone,
        highlightColor: d.highlight,
      },
      warnings,
    }
  },
}

const customerEngine: Engine<customer.CustomerDoc> = {
  blank: customer.blank,
  fromRequest: customer.fromRequest,
  frames: (d) => [
    {
      label: "1920 × 1080",
      width: customer.W,
      height: customer.H,
      filename: `customer-story-${slugify(customer.displayName(d), "customer-story")}.png`,
      draw: (ctx) => void customerDraw.drawPost(ctx, d),
    },
  ],
  images: customerDraw.imagesOf,
  minWidth: customerDraw.MIN_WIDTH,
  fonts: (d) => requestFonts([SEMIBOLD, BOLD], `Customer story${customer.displayName(d)}`),
  report: (d, r) => {
    const look = customer.look(d)
    const logo = customer.logoInfo(d, look.lightText)
    const warnings = unknownHoggie(r, "it picked one for the company")
    const { exact, near } = customer.searchCustomers(d.company)
    if (logo.src === "none") {
      warnings.push(
        exact
          ? `${exact.name} is on posthog.com/customers, but its logo isn't in the maker yet, so the image shows the name. Pass logoUrl (its logo on posthog.com, or the company's own).`
          : `"${d.company}" isn't in the maker's posthog.com/customers logos, so the image shows the name. Pass logoUrl${near.length ? `, or the exact name of one of: ${near.map((c) => c.name).join(", ")}` : ""}.`,
      )
    } else if (imageFailed(logo.id, customerDraw.MIN_WIDTH)) {
      warnings.push(
        `The logo at ${logo.id} didn't load, so the image shows the name. Its server must allow cross-origin requests (res.cloudinary.com does), or pass it as a data:image URL.`,
      )
    }
    return {
      facts: {
        company: customer.displayName(d),
        logo:
          logo.src !== "none" && imageFailed(logo.id, customerDraw.MIN_WIDTH)
            ? "didn't load: the company name is drawn instead (see warnings)"
            : logo.src === "library"
              ? "from posthog.com/customers"
              : logo.src === "upload"
                ? "from logoUrl"
                : "none: the company name is drawn instead",
        logoColors: logo.mode === "match" ? "matched to the text color" : "the logo's own",
        hoggie: customer.resolvedHog(d),
        hoggieChosenBy: customer.isAuto(d) ? "matched to the company" : "you",
        color: d.color,
        tone: look.tone,
        ink: d.ink,
      },
      warnings,
    }
  },
}

/**
 * How much of the event details (date, time, location) the hoggie covers: the pixels in those
 * lines' boxes, plus a little room after them, that change when the hoggie is drawn. Compared on
 * pixels rather than boxes, so the transparent parts of the hoggie's box don't count. Also returns
 * the hoggie's box.
 */
function hoggieOverDetails(d: event.EventDoc): { covered: number; hog: Rect | null } {
  const k = 0.5 // half size is plenty to see an overlap, and quick
  const GAP = 16
  const draw = (doc: event.EventDoc, layout?: { details: Rect[] }) => {
    const canvas = document.createElement("canvas")
    canvas.width = canvas.height = Math.round(eventDraw.SIZE * k)
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!
    ctx.scale(k, k)
    const hog = eventDraw.drawPost(ctx, doc, false, layout)
    return { ctx, hog }
  }
  const layout = { details: [] as Rect[] }
  const withHog = draw(d, layout)
  const without = draw({ ...d, hog: "" }).ctx
  let covered = 0
  for (const box of layout.details) {
    const x = Math.floor(box.x * k)
    const y = Math.floor(box.y * k)
    const w = Math.ceil((box.w + GAP) * k)
    const h = Math.ceil(box.h * k)
    const a = withHog.ctx.getImageData(x, y, w, h).data
    const b = without.getImageData(x, y, w, h).data
    for (let i = 0; i < a.length; i += 4)
      if (
        Math.abs(a[i]! - b[i]!) +
          Math.abs(a[i + 1]! - b[i + 1]!) +
          Math.abs(a[i + 2]! - b[i + 2]!) >
        24
      )
        covered++
  }
  return { covered, hog: withHog.hog }
}

/** The smallest the event tool shrinks a hoggie to keep it off the details. */
const EVENT_MIN_FIT_SIZE = 60

const eventEngine: Engine<event.EventDoc> = {
  blank: event.blank,
  fromRequest: event.fromRequest,
  frames: (d) => [
    {
      label: "1080 × 1080",
      width: eventDraw.SIZE,
      height: eventDraw.SIZE,
      filename: `${slugify(event.firstLine(d), "event")}${d.date ? `-${d.date}` : ""}.png`,
      draw: (ctx) => void eventDraw.drawPost(ctx, d),
    },
  ],
  images: eventDraw.imagesOf,
  fonts: (d) => {
    eventDraw.addSqueak()
    requestFonts([700], d.title.toUpperCase() + eventDraw.FIXED_TEXT, "Squeak")
    requestFonts([SEMIBOLD, BOLD], `${d.location}${d.tz}${d.title}${eventDraw.FIXED_TEXT}`)
  },
  fit: (d, r) => {
    if (!d.hog) return {}
    const start = { hogSize: d.hogSize, hogX: d.hogX }
    let { covered, hog } = hoggieOverDetails(d)
    // Left to the maker: move the hoggie right while it fits on the image, then shrink it, until
    // it clears the details.
    if (!placesHoggie(r))
      for (let i = 0; covered > 0 && i < 20; i++) {
        const step = 2 * 10.8 // hoggieX units are 10.8px
        if (hog && hog.x + hog.w + step <= eventDraw.SIZE - 8 && d.hogX < 50) d.hogX += 2
        else if (d.hogSize > EVENT_MIN_FIT_SIZE) d.hogSize -= 5
        else break
        ;({ covered, hog } = hoggieOverDetails(d))
      }
    const moved = d.hogX !== start.hogX || d.hogSize !== start.hogSize
    return {
      note: moved
        ? `Placed the hoggie (hoggieSize ${d.hogSize}, hoggieX ${d.hogX}) so it doesn't cover the date, time or location.`
        : undefined,
      warning: covered
        ? `The hoggie covers part of the date, time or location. ${placesHoggie(r) ? "Leave out hoggieSize, hoggieX and hoggieY to have it placed for you, or" : "Shorten the time or location, or"} set hoggieSize (50–200) and hoggieX (-50–50, right is positive) yourself.`
        : undefined,
    }
  },
  report: (d, r) => ({
    facts: {
      headline: event.firstLine(d),
      date: event.shortDate(d),
      time: event.timeLine(d) || "none",
      location: d.location || "none",
      hoggie: d.hog || "none",
      hoggieSize: d.hogSize,
      hoggieX: d.hogX,
      hoggieY: d.hogY,
      photo: event.hasPhoto(d) ? d.photo.id : "none",
      logos: d.logos.map((l) => l.id),
    },
    warnings: [
      ...unknownHoggie(r, "the image has no hoggie"),
      ...[event.hasPhoto(d) ? d.photo.id : "", ...d.logos.map((l) => l.id)]
        .filter((url) => url && imageFailed(url))
        .map(
          (url) =>
            `${url} didn't load, so it's left out. Its server must allow cross-origin requests, or pass it as a data:image URL.`,
        ),
    ],
  }),
}

const buildEngine: Engine<build.BuildDoc> = {
  blank: build.blank,
  fromRequest: build.fromRequest,
  frames: (d, size) =>
    build.ORDER.filter((fmt) => !size || fmt === size).map((fmt) => ({
      label: `${fmt} ${build.FORMATS[fmt].w} × ${build.FORMATS[fmt].h}`,
      width: build.FORMATS[fmt].w,
      height: build.FORMATS[fmt].h,
      filename: `${slugify(build.plainTitle(d), "build-mode")}-${build.FORMATS[fmt].file}.png`,
      draw: (ctx) => void buildDraw.drawPost(ctx, d, fmt, { exporting: true }),
    })),
  images: buildDraw.imagesOf,
  fonts: (d) => requestFonts([SEMIBOLD, MEDIUM], d.title + build.authorsOf(d).join("")),
  report: (d) => {
    const warnings: string[] = []
    const hl = d.hlText.trim()
    if (hl && !d.title.replace(/\|/g, "\n").toLowerCase().includes(hl.toLowerCase()))
      warnings.push(`The highlight "${hl}" isn't in the title, so nothing is highlighted.`)
    if (!d.imgId) warnings.push("No imageUrl, so the picture box is empty.")
    else if (imageFailed(d.imgId))
      warnings.push(
        `${d.imgId} didn't load. Its server must allow cross-origin requests, or pass it as a data:image URL.`,
      )
    return {
      facts: { authors: build.authorsOf(d), highlightColor: d.highlight },
      warnings,
    }
  },
}

const ENGINES: Record<MakerSlug, Engine<Stamped>> = {
  blog: blogEngine as unknown as Engine<Stamped>,
  "customer-stories": customerEngine as unknown as Engine<Stamped>,
  events: eventEngine as unknown as Engine<Stamped>,
  "build-mode": buildEngine as unknown as Engine<Stamped>,
}

export interface MakeOptions {
  /** Also open the image in the maker (saved in the user's list). */
  show?: boolean
  /** Also download the PNG(s). */
  download?: boolean
  /** Download at 2x. */
  scale?: 1 | 2
  /** Build mode: one size ("LinkedIn", "Website", "X", "Substack") instead of all four. */
  size?: string
  /** The router's navigate, to open the maker. */
  navigate?: (path: string) => void
}

/** The longest side of the preview the agent gets back: enough to judge it, cheap to send. */
const PREVIEW_MAX = 960

function preview(frame: Frame): string {
  const k = Math.min(1, PREVIEW_MAX / Math.max(frame.width, frame.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(frame.width * k)
  canvas.height = Math.round(frame.height * k)
  const ctx = canvas.getContext("2d")!
  ctx.scale(k, k)
  frame.draw(ctx)
  try {
    return canvas.toDataURL("image/jpeg", 0.85).replace(/^data:image\/jpeg;base64,/, "")
  } catch {
    // A picture from a server that doesn't allow cross-origin use slipped through.
    throw new Error(
      "A picture's server doesn't allow cross-origin use, so the image can't be exported. Pass it as a data:image URL instead.",
    )
  }
}

/** Makes an image with a maker; see the make_*_image tools in webmcp-tools.ts. */
export async function makeImage(slug: MakerSlug, request: Request, opts: MakeOptions = {}) {
  const engine = ENGINES[slug]
  const doc = engine.fromRequest(request)
  if (typeof doc === "string") throw new Error(doc)
  if (slug === "build-mode" && opts.size && !build.ORDER.includes(opts.size as build.FormatKey))
    throw new Error(`size must be one of ${build.ORDER.join(", ")}.`)

  engine.fonts(doc)
  await Promise.all([imagesReady(engine.images(doc), engine.minWidth), document.fonts.ready])
  let fitted: { note?: string; warning?: string } = {}
  try {
    fitted = engine.fit?.(doc, request) ?? {}
  } catch {
    // A tainted canvas can't be read; the preview below says why.
  }

  const frames = engine.frames(doc, opts.size)
  const shown = frames[0]!
  const image = preview(shown)
  const { facts, warnings } = engine.report(doc, request)
  if (fitted.warning) warnings.push(fitted.warning)

  const path = makerPath(slug)
  const link = `${window.location.origin}${path}?image=${encodeImage(doc as unknown as Doc)}`

  const downloaded: string[] = []
  if (opts.download) {
    const scale = opts.scale === 2 ? 2 : 1
    for (const frame of frames) {
      const filename = scale === 2 ? frame.filename.replace(/\.png$/, "@2x.png") : frame.filename
      await downloadPng(slug, { ...frame, scale, filename, images: engine.images(doc) })
      downloaded.push(filename)
    }
  }

  if (opts.show) {
    openInMaker(slug, doc as unknown as Doc)
    if (window.location.pathname !== path) opts.navigate?.(path)
  }

  return {
    maker: slug,
    preview: `${shown.label}, shown at ${PREVIEW_MAX}px for checking`,
    link,
    opened: opts.show ? `${window.location.origin}${path}` : undefined,
    downloaded: downloaded.length ? downloaded : undefined,
    ...facts,
    adjusted: fitted.note,
    warnings,
    image,
  }
}

export interface ExportedPng {
  /** The PNG, base64. */
  png: string
  filename: string
  width: number
  height: number
}

/**
 * Exports a saved image (an `?image=` link's value) as the PNG its maker downloads: opened the way
 * the maker opens a link (its settings over the maker's `blank()`), with the same images and
 * fonts waited for and the same full-size drawing as `downloadPng`. Used by the headless page
 * (headless.ts) behind https://brand.posthog.com/tools/images/<maker>.png. `size` picks a build
 * mode size (default LinkedIn).
 */
export async function exportPng(
  slug: MakerSlug,
  param: string,
  opts: { scale?: 1 | 2; size?: string } = {},
): Promise<ExportedPng> {
  const engine = ENGINES[slug]
  if (!engine) throw new Error(`No image maker "${slug}".`)
  const saved = decodeImage(param)
  if (!saved) throw new Error("The image parameter isn't a saved image (base64url JSON).")
  const doc = { ...engine.blank(), ...(withoutUploads(saved) as Doc) } as Stamped
  if (slug === "build-mode" && opts.size && !build.ORDER.includes(opts.size as build.FormatKey))
    throw new Error(`size must be one of ${build.ORDER.join(", ")}.`)

  engine.fonts(doc)
  await Promise.all([imagesReady(engine.images(doc), engine.minWidth), document.fonts.ready])
  const frame = engine.frames(doc, opts.size)[0]!
  const scale = opts.scale === 2 ? 2 : 1
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(frame.width * scale)
  canvas.height = Math.round(frame.height * scale)
  const ctx = canvas.getContext("2d")!
  ctx.scale(scale, scale)
  frame.draw(ctx)
  let png: string
  try {
    png = canvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, "")
  } catch {
    throw new Error(
      "A picture's server doesn't allow cross-origin use, so the image can't be exported.",
    )
  }
  return {
    png,
    filename: scale === 2 ? frame.filename.replace(/\.png$/, "@2x.png") : frame.filename,
    width: canvas.width,
    height: canvas.height,
  }
}
