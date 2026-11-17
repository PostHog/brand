import { type ChangeEvent, type MouseEvent, useEffect, useMemo, useRef, useState } from "react"
import { ImageActions, ImageList, MakerFrame } from "../../editor/MakerFrame.tsx"
import { PaintedCanvas } from "../../editor/PaintedCanvas.tsx"
import {
  BOLD,
  type Rect,
  SEMIBOLD,
  inRect,
  requestFonts,
  slugify,
  toUnits,
} from "../../editor/canvas.ts"
import { downloadPng } from "../../editor/download.ts"
import { HoggieGallery } from "../../editor/HoggieGallery.tsx"
import {
  Field,
  Hint,
  PictureCard,
  Range,
  Section,
  Segmented,
  Swatches,
  Switch,
  TextField,
} from "../../editor/fields.tsx"
import { CloseIcon, DownloadIcon, PlusIcon } from "../../editor/icons.tsx"
import { useImageStore } from "../../editor/store.ts"
import { makerHoggies } from "../../hoggies.ts"
import { FOOTER_TOP, SIZE, addSqueak, drawPost, hogUrl, imagesOf } from "./draw.ts"
import {
  COLOR_KEYS,
  type EventDoc,
  type EventPhoto,
  type FooterKey,
  MAX_LOGOS,
  blank,
  firstLine,
  footSwatch,
  hasPhoto,
  shortDate,
  swatch,
} from "./model.ts"

const SLUG = "events"

// Thumbnails and downloads leave out the stage's "Choose hoggie" placeholder.
const thumb = (d: EventDoc) => ({
  width: SIZE,
  height: SIZE,
  paint: (ctx: CanvasRenderingContext2D) => void drawPost(ctx, d),
})

// Everything the drawings write besides what people type (month names, digits, the pill).
const FIXED_TEXT = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789:,–… "

function fileName(d: EventDoc, scale: number) {
  return `${slugify(firstLine(d), "event")}${d.date ? `-${d.date}` : ""}${scale === 2 ? "@2x" : ""}.png`
}

const colorLabel = (k: string) => k.replace("-", " ")

export default function EventMaker() {
  const store = useImageStore(SLUG, blank)
  const { current, edit, setStatus } = store
  const d = current.data
  const hogs = makerHoggies()
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [scale, setScale] = useState(1)

  // The faces the drawings use: Squeak Bold for headlines, RoundHog for the rest.
  const titles = store.items.map((it) => it.data.title.toUpperCase()).join("")
  const details = store.items
    .map((it) => `${it.data.location}${it.data.tz}${it.data.title}`)
    .join("")
  useEffect(() => {
    addSqueak()
    requestFonts([700], titles + FIXED_TEXT, "Squeak")
  }, [titles])
  useEffect(() => requestFonts([SEMIBOLD, BOLD], details + FIXED_TEXT), [details])

  // ---- Stage ----
  const hit = useRef<Rect | null>(null)
  const paintStage = useMemo(
    () => (ctx: CanvasRenderingContext2D) => {
      hit.current = drawPost(ctx, d, true)
    },
    [d],
  )
  const onHog = (e: MouseEvent<HTMLCanvasElement>) => {
    const p = toUnits(e, e.currentTarget, SIZE, SIZE)
    return p.y < FOOTER_TOP && inRect(p, hit.current)
  }

  // ---- Uploads ----
  const photoInput = useRef<HTMLInputElement>(null)
  const logoInput = useRef<HTMLInputElement>(null)
  const fileOf = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    return file ? { url: URL.createObjectURL(file), name: file.name.replace(/\.[^.]+$/, "") } : null
  }
  const onPhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const f = fileOf(e)
    if (!f) return
    // A new upload starts in front of the hoggie, shifted left so both show; a replacement keeps
    // its placement.
    edit((cur) => ({
      photo: cur.photo?.id
        ? { ...cur.photo, id: f.url, name: f.name }
        : {
            id: f.url,
            name: f.name,
            size: 70,
            x: cur.hog ? -25 : 0,
            y: 0,
            flip: false,
            front: true,
          },
    }))
  }
  const onLogo = (e: ChangeEvent<HTMLInputElement>) => {
    const f = fileOf(e)
    if (!f) return
    edit((cur) => ({
      logos: [...(cur.logos ?? []).slice(0, MAX_LOGOS - 1), { id: f.url, name: f.name }],
    }))
  }
  const editPhoto = (patch: Partial<EventPhoto>) =>
    edit((cur) => (cur.photo ? { photo: { ...cur.photo, ...patch } } : {}))

  // ---- Download ----
  const download = () => {
    const name = fileName(d, scale)
    downloadPng(SLUG, {
      width: SIZE,
      height: SIZE,
      scale,
      filename: name,
      images: imagesOf(d),
      draw: (ctx) => void drawPost(ctx, d),
    }).then(
      () => setStatus(`Downloaded ${name}`),
      () => setStatus("Couldn’t make the PNG. Try again."),
    )
  }

  const ph = hasPhoto(d) ? d.photo : null
  const hasHog = !!(d.hog && hogs[d.hog])
  const whiteHead = !d.darkText
  const logoColor = d.logoColor === "white" || d.logoColor === "black" ? d.logoColor : "auto"
  const logos = d.logos ?? []
  const full = logos.length >= MAX_LOGOS

  return (
    <MakerFrame
      slug={SLUG}
      engine="event"
      title="Event images"
      lede="Square event posts with a calendar tile, time, location, partner logos and a hoggie or your own picture."
      docName={firstLine(d)}
      status={store.status}
      downloads={
        <>
          <select
            aria-label="Download size"
            title="Download size"
            value={scale}
            onChange={(e) => setScale(+e.target.value)}
          >
            <option value={1}>1080 × 1080</option>
            <option value={2}>2160 × 2160 (2×)</option>
          </select>
          <button className="btn btn-primary" type="button" onClick={download}>
            <DownloadIcon />
            Download PNG
          </button>
        </>
      }
      list={
        <ImageList
          label="Event images"
          items={store.items}
          currentId={current.id}
          onSelect={store.select}
          onNew={() => store.add(blank())}
          thumb={thumb}
          title={firstLine}
          byline={shortDate}
        />
      }
      stage={
        <>
          <div className="canvas-wrap">
            <PaintedCanvas
              width={SIZE}
              height={SIZE}
              paint={paintStage}
              aria-label="Event image preview"
              onPointerMove={(e) => {
                e.currentTarget.style.cursor = onHog(e) ? "pointer" : "default"
              }}
              onClick={(e) => onHog(e) && setGalleryOpen(true)}
            />
          </div>
          <p className="stage-hint">
            {d.hog
              ? "Click the hoggie on the image to swap it."
              : ph
                ? "No hoggie. Add one under Hoggie if you like."
                : "Click “Choose hoggie” on the image to add one."}
          </p>
        </>
      }
      settings={
        <>
          <Section title="Event">
            <TextField
              label="Headline"
              className="title-input"
              rows={4}
              value={d.title}
              onChange={(title) => edit({ title })}
              hint={
                <>
                  <Hint>Press Enter to start a new line.</Hint>
                  <Hint>
                    To make only some words bold, put two stars on each side: <b>**FREE**</b> PIZZA.
                    The other words go lighter and smaller. Without stars, the whole headline stays
                    bold.
                  </Hint>
                </>
              }
            />
            <Segmented
              label="Headline fit"
              options={[
                { value: "fit", label: "Fill the width" },
                { value: "even", label: "Same size" },
              ]}
              value={d.headline === "even" ? "even" : "fit"}
              onChange={(headline) => edit({ headline })}
            />
            <Range
              label="Headline size"
              min={60}
              max={150}
              step={5}
              suffix="%"
              value={+d.hlScale || 100}
              onChange={(hlScale) => edit({ hlScale })}
            />
            <div className="field">
              <Switch
                checked={!!d.glow && whiteHead}
                disabled={!whiteHead}
                onChange={(glow) => edit({ glow })}
              >
                Headline glow
              </Switch>
              <Hint>
                {whiteHead
                  ? "A soft white glow around the headline."
                  : "Glow is only for white text. Turn off Dark text in Colors to use it."}
              </Hint>
            </div>
            <Field label="Date">
              {(id) => (
                <input
                  id={id}
                  className="input"
                  type="date"
                  value={d.date || ""}
                  onChange={(e) => edit({ date: e.target.value })}
                />
              )}
            </Field>
            <div className="row2">
              <Field label="Starts">
                {(id) => (
                  <input
                    id={id}
                    className="input"
                    type="time"
                    value={d.start || ""}
                    onChange={(e) => edit({ start: e.target.value })}
                  />
                )}
              </Field>
              <Field label="Ends">
                {(id) => (
                  <input
                    id={id}
                    className="input"
                    type="time"
                    value={d.end || ""}
                    onChange={(e) => edit({ end: e.target.value })}
                  />
                )}
              </Field>
            </div>
            <TextField
              label={
                <>
                  Time zone <span className="hint">(optional)</span>
                </>
              }
              placeholder="e.g. PT, GMT, CET"
              value={d.tz || ""}
              onChange={(tz) => edit({ tz })}
            />
            <TextField
              label="Location"
              rows={3}
              placeholder={"Venue\nStreet address\nCity"}
              value={d.location || ""}
              onChange={(location) => edit({ location })}
              hint={<Hint>Press Enter for a new line, up to 4 lines.</Hint>}
            />
          </Section>

          <Section title="Hoggie">
            <PictureCard
              kind="hog-card"
              picture={hasHog ? <img src={hogUrl(d.hog)} alt="" /> : <PlusIcon strokeWidth={1.8} />}
              pictureLabel="Choose hoggie"
              onPictureClick={() => setGalleryOpen(true)}
              name={hasHog ? d.hog : "No hoggie yet"}
            >
              <button className="btn btn-sm" type="button" onClick={() => setGalleryOpen(true)}>
                {hasHog ? "Change" : "Choose hoggie"}
              </button>
              {hasHog ? (
                <button className="btn btn-sm" type="button" onClick={() => edit({ hog: "" })}>
                  Remove
                </button>
              ) : null}
            </PictureCard>
            <Range
              label="Size"
              min={50}
              max={200}
              step={5}
              suffix="%"
              value={d.hogSize}
              onChange={(hogSize) => edit({ hogSize })}
            />
            <Range
              label="Move left / right"
              min={-50}
              max={50}
              step={1}
              value={d.hogX}
              onChange={(hogX) => edit({ hogX })}
            />
            <Range
              label="Move down / up"
              min={-50}
              max={50}
              step={1}
              value={d.hogY}
              onChange={(hogY) => edit({ hogY })}
            />
            <Switch checked={!!d.flip} onChange={(flip) => edit({ flip })}>
              Flip to face the other way
            </Switch>
          </Section>

          <Section title="Your image">
            <Hint>
              Add your own picture next to the hoggie or instead of it. They can overlap. PNG with a
              transparent background works best.
            </Hint>
            <PictureCard
              kind="hog-card"
              picture={ph ? <img src={ph.id} alt="" /> : <PlusIcon strokeWidth={1.8} />}
              pictureLabel="Upload an image"
              onPictureClick={() => photoInput.current?.click()}
              name={ph ? ph.name || "Your image" : "No image yet"}
            >
              <button
                className="btn btn-sm"
                type="button"
                onClick={() => photoInput.current?.click()}
              >
                {ph ? "Replace" : "Upload image"}
              </button>
              {ph ? (
                <button className="btn btn-sm" type="button" onClick={() => edit({ photo: null })}>
                  Remove
                </button>
              ) : null}
            </PictureCard>
            <input
              ref={photoInput}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
              aria-label="Upload an image file"
              hidden
              onChange={onPhoto}
            />
            {ph ? (
              <div className="section-inner">
                <Range
                  label="Size"
                  min={20}
                  max={200}
                  step={5}
                  suffix="%"
                  value={+ph.size || 100}
                  onChange={(size) => editPhoto({ size })}
                />
                <Range
                  label="Move left / right"
                  min={-60}
                  max={60}
                  step={1}
                  value={+ph.x || 0}
                  onChange={(x) => editPhoto({ x })}
                />
                <Range
                  label="Move down / up"
                  min={-60}
                  max={60}
                  step={1}
                  value={+ph.y || 0}
                  onChange={(y) => editPhoto({ y })}
                />
                <Switch checked={!!ph.flip} onChange={(flip) => editPhoto({ flip })}>
                  Flip
                </Switch>
                <Switch checked={!!ph.front} onChange={(front) => editPhoto({ front })}>
                  In front of the hoggie
                </Switch>
              </div>
            ) : null}
          </Section>

          <Section title="Colors">
            <Swatches
              label="Background"
              options={COLOR_KEYS.map((k) => ({
                key: k,
                color: swatch(k, 500).css,
                label: colorLabel(k),
              }))}
              value={d.bg}
              onChange={(bg) => edit({ bg })}
            />
            <Swatches
              label="Calendar"
              options={COLOR_KEYS.map((k) => ({
                key: k,
                color: swatch(k, 700).css,
                label: colorLabel(k),
              }))}
              value={d.cal}
              onChange={(cal) => edit({ cal })}
            />
            <div className="field">
              <Switch checked={!!d.calFlip} onChange={(calFlip) => edit({ calFlip })}>
                Flip month text
              </Switch>
              <Hint>
                The month on the calendar is{" "}
                {(d.calFlip ? whiteHead : !whiteHead) ? "dark" : "white"}. Turn this on to make it
                the opposite of the other text.
              </Hint>
            </div>
            <Swatches<FooterKey>
              label="Footer"
              options={(["white", ...COLOR_KEYS] as FooterKey[]).map((k) => ({
                key: k,
                color: k === "white" ? "#ffffff" : swatch(k, 500).css,
                label: colorLabel(k),
              }))}
              value={d.footer}
              onChange={(footer) => edit({ footer })}
            />
            <Segmented
              label="PostHog logo"
              options={[
                { value: "auto", label: "Auto" },
                { value: "white", label: "White" },
                { value: "black", label: "Black" },
              ]}
              value={logoColor}
              onChange={(c) => edit({ logoColor: c })}
              hint={
                logoColor === "auto" ? (
                  <Hint>
                    Auto picks {footSwatch(d.footer).light ? "white" : "black"} for this footer
                    color.
                  </Hint>
                ) : null
              }
            />
            <div className="field">
              <Switch checked={!!d.darkText} onChange={(darkText) => edit({ darkText })}>
                Dark text
              </Switch>
              <Hint>
                Text is white unless this is on. Use it on light colors like yellow, lemon or lime.
              </Hint>
            </div>
          </Section>

          <Section title="Partner logos">
            <Hint>
              Up to 4 logos sit next to PostHog in the footer. SVG or PNG with a transparent
              background works best.
            </Hint>
            {logos.length ? (
              <div className="logos">
                {logos.map((lg, i) => (
                  <div className="logo-item" key={`${i}-${lg.id}`}>
                    <span className="lp">
                      <img src={lg.id} alt="" />
                    </span>
                    <span className="ln">{lg.name || `Logo ${i + 1}`}</span>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={`Remove ${lg.name || "logo"}`}
                      onClick={() =>
                        edit((cur) => ({ logos: (cur.logos ?? []).filter((_, j) => j !== i) }))
                      }
                    >
                      <CloseIcon />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            {full ? null : (
              <div className="actions">
                <button
                  className="btn btn-sm"
                  type="button"
                  onClick={() => logoInput.current?.click()}
                >
                  Add logo
                </button>
              </div>
            )}
            <input
              ref={logoInput}
              type="file"
              accept="image/svg+xml,image/png,image/jpeg,image/webp"
              aria-label="Add a logo file"
              hidden
              onChange={onLogo}
            />
            {full ? <Hint>That’s the maximum of 4 logos.</Hint> : null}
          </Section>

          <ImageActions key={current.id} onDuplicate={store.duplicate} onDelete={store.remove} />
        </>
      }
    >
      <HoggieGallery
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        hogs={hogs}
        selected={d.hog || null}
        onPick={(name) => name && edit({ hog: name })}
      />
    </MakerFrame>
  )
}
