import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react"
import { MakerFrame, ImageActions, ImageList, useImagePicker } from "../../editor/MakerFrame.tsx"
import { PaintedCanvas } from "../../editor/PaintedCanvas.tsx"
import {
  type Rect,
  MEDIUM,
  SEMIBOLD,
  clamp,
  inRect,
  requestFonts,
  slugify,
  toUnits,
} from "../../editor/canvas.ts"
import { downloadPng } from "../../editor/download.ts"
import {
  Field,
  Hint,
  PictureCard,
  Range,
  Section,
  Swatches,
  Switch,
  TextField,
} from "../../editor/fields.tsx"
import { CloseIcon, DownloadIcon, ImageIcon } from "../../editor/icons.tsx"
import { useImageStore } from "../../editor/store.ts"
import { drawPost, imagesOf } from "./draw.ts"
import {
  ASSETS,
  type BuildDoc,
  FORMATS,
  type Fit,
  type FormatKey,
  HL,
  HL_KEYS,
  MAX_AUTHORS,
  ORDER,
  authorLabel,
  authorNames,
  authorsOf,
  blank,
  fitOf,
  plainTitle,
  sizeNote,
} from "./model.ts"

const SLUG = "build-mode"

// Thumbnails are the LinkedIn size, like the list always showed.
const thumb = (d: BuildDoc) => ({
  width: FORMATS.LinkedIn.w,
  height: FORMATS.LinkedIn.h,
  paint: (ctx: CanvasRenderingContext2D) => void drawPost(ctx, d, "LinkedIn"),
})

function highlightFound(d: BuildDoc): boolean {
  const w = d.hlText.trim()
  return !w || d.title.replace(/\|/g, "\n").toLowerCase().includes(w.toLowerCase())
}

function fileName(d: BuildDoc, fmt: FormatKey) {
  return `${slugify(plainTitle(d), "build-mode")}-${FORMATS[fmt].file}.png`
}

export default function BuildMaker() {
  const store = useImageStore(SLUG, blank)
  const { current, edit, setStatus } = store
  const d = current.data
  const [active, setActive] = useState<FormatKey>("LinkedIn")
  const F = FORMATS[active]

  // The text the drawings use, so RoundHog's faces for it are loaded.
  const allText = store.items.map((it) => it.data.title + authorsOf(it.data).join("")).join("")
  useEffect(() => requestFonts([SEMIBOLD, MEDIUM], allText), [allText])

  // ---- Stage ----
  const hit = useRef<Rect | null>(null)
  const paintStage = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      hit.current = drawPost(ctx, d, active).hit
    },
    [d, active],
  )

  // ---- Image upload ----
  const picker = useImagePicker(
    (file) => {
      edit({ imgId: URL.createObjectURL(file), imgName: file.name.replace(/\.[a-z0-9]+$/i, "") })
      setStatus("Image shown. Uploads stay in this browser, and the link doesn’t carry them.")
    },
    () => setStatus("That file isn’t an image. Choose a PNG, JPG or WebP."),
  )

  // ---- Downloads ----
  const save = (fmt: FormatKey) =>
    downloadPng(SLUG, {
      width: FORMATS[fmt].w,
      height: FORMATS[fmt].h,
      filename: fileName(d, fmt),
      images: imagesOf(d),
      draw: (ctx) => drawPost(ctx, d, fmt, { exporting: true }),
    })
  const downloadOne = () =>
    save(active).then(
      () => setStatus(`Downloaded ${fileName(d, active)}`),
      () => setStatus("Couldn’t make the PNG. Try again."),
    )
  const downloadAll = async () => {
    let done = 0
    try {
      for (const fmt of ORDER) {
        setStatus(`Saving ${fmt}… (${done + 1} of ${ORDER.length})`)
        await save(fmt)
        done++
      }
      setStatus(`Downloaded all ${ORDER.length} sizes`)
    } catch {
      setStatus(
        done ? `Stopped after ${done} of ${ORDER.length}` : "Couldn’t make the PNG. Try again.",
      )
    }
  }

  // ---- Per-size fit ----
  const fit = fitOf(d, active)
  const editFit = (patch: Partial<Fit>) =>
    edit((cur) => ({ fit: { ...cur.fit, [active]: { ...fitOf(cur, active), ...patch } } }))
  const resetFit = () =>
    edit((cur) => {
      const { [active]: _drop, ...rest } = cur.fit
      return { fit: rest }
    })

  // ---- Authors ----
  const names = authorNames()
  const coAuthors = (d.coAuthors ?? []).slice(0, MAX_AUTHORS - 1)
  const addAuthor = () =>
    edit((cur) => {
      const used = authorsOf(cur)
      const next = names.find((n) => !used.includes(n)) ?? names[0]!
      return { coAuthors: [...(cur.coAuthors ?? []), next].slice(0, MAX_AUTHORS - 1) }
    })

  const hlFound = highlightFound(d)
  const imageUrl = d.imgId
  const ar = F.w / F.h

  return (
    <MakerFrame
      slug={SLUG}
      engine="build"
      title="Build mode images"
      lede="Build mode art on the blueprint grid, made once and exported for LinkedIn, the website, X and Substack."
      docName={plainTitle(d)}
      status={store.status}
      downloads={
        <>
          <button className="btn" type="button" onClick={downloadOne}>
            Download this size
          </button>
          <button className="btn btn-primary" type="button" onClick={downloadAll}>
            <DownloadIcon />
            Download all sizes
          </button>
        </>
      }
      list={
        <ImageList
          label="Build mode images"
          items={store.items}
          currentId={current.id}
          onSelect={store.select}
          onNew={() => store.add(blank())}
          thumb={thumb}
          title={plainTitle}
          byline={authorLabel}
        />
      }
      stage={
        <>
          <div className="stage-head">
            <span className="size-name">{active}</span>
            <span className="size-dims">
              {F.w} × {F.h}
            </span>
            <span className="size-note">{sizeNote(active)}</span>
          </div>
          <div className="canvas-wrap" style={{ "--ar": ar } as CSSProperties}>
            <PaintedCanvas
              width={F.w}
              height={F.h}
              paint={paintStage}
              aria-label="Build mode image preview"
              onPointerMove={(e) => {
                const p = toUnits(e, e.currentTarget, F.w, F.h)
                e.currentTarget.style.cursor = inRect(p, hit.current) ? "pointer" : "default"
              }}
              onClick={(e) => {
                if (inRect(toUnits(e, e.currentTarget, F.w, F.h), hit.current)) picker.open()
              }}
            />
          </div>
          <div className="strip">
            {ORDER.filter((f) => f !== active).map((f) => (
              <button
                key={f}
                type="button"
                className="mini"
                aria-label={`Work on the ${f} size`}
                onClick={() => setActive(f)}
              >
                <PaintedCanvas
                  width={FORMATS[f].w}
                  height={FORMATS[f].h}
                  paint={(ctx) => void drawPost(ctx, d, f)}
                  aria-hidden
                />
                <span className="lbl">
                  {f}
                  <span>
                    {FORMATS[f].w} × {FORMATS[f].h}
                  </span>
                </span>
              </button>
            ))}
          </div>
          <p className="stage-hint">
            Click the image area to upload or replace the image. Click a smaller size to work on it.
          </p>
          {picker.element}
        </>
      }
      settings={
        <>
          <Section title="Post">
            <TextField
              label="Title"
              className="title-input"
              rows={3}
              value={d.title}
              onChange={(title) => edit({ title })}
              hint={
                <Hint>Lines wrap on their own. Press Enter or type | to force a line break.</Hint>
              }
            />
            <TextField
              label="Highlight"
              placeholder="A word or phrase from the title"
              value={d.hlText}
              onChange={(hlText) => edit({ hlText })}
              hint={
                !d.hlText.trim() ? (
                  <Hint>Leave empty for no highlight.</Hint>
                ) : hlFound ? (
                  <Hint>Highlighted in the title. Leave empty for no highlight.</Hint>
                ) : (
                  <Hint warn>That text isn’t in the title, so nothing is highlighted.</Hint>
                )
              }
            />
            <Swatches
              label="Highlight color"
              options={HL_KEYS.map((k) => ({ key: k, color: HL[k][0] }))}
              value={d.highlight}
              onChange={(highlight) => edit({ highlight })}
            />
          </Section>

          <Section title="Author">
            <div className="author-row">
              <Avatar name={d.author} />
              <Field label="Author">
                {(id) => (
                  <select
                    id={id}
                    className="input"
                    value={names.includes(d.author) ? d.author : names[0]}
                    onChange={(e) => edit({ author: e.target.value })}
                  >
                    {names.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
            </div>
            {coAuthors.length ? (
              <div className="co-authors">
                {coAuthors.map((name, i) => (
                  <div className="co-row" key={i}>
                    <Avatar name={name} />
                    <select
                      className="input"
                      aria-label={`Author ${i + 2}`}
                      value={names.includes(name) ? name : names[0]}
                      onChange={(e) =>
                        edit((cur) => {
                          const a = [...(cur.coAuthors ?? [])]
                          a[i] = e.target.value
                          return { coAuthors: a }
                        })
                      }
                    >
                      {names.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={`Remove author ${i + 2}`}
                      onClick={() =>
                        edit((cur) => ({
                          coAuthors: (cur.coAuthors ?? []).filter((_, j) => j !== i),
                        }))
                      }
                    >
                      <CloseIcon />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            {coAuthors.length < MAX_AUTHORS - 1 ? (
              <div className="actions">
                <button className="btn btn-sm" type="button" onClick={addAuthor}>
                  Add another author
                </button>
              </div>
            ) : null}
            <Hint>
              Shows on LinkedIn and X, one row per author, up to 3. To add a person, add their photo
              to the build mode data in PostHog/brand.
            </Hint>
          </Section>

          <Section title="Image">
            <PictureCard
              kind="pic-card"
              picture={imageUrl ? <img src={imageUrl} alt="" /> : <ImageIcon />}
              pictureLabel="Upload image"
              onPictureClick={picker.open}
              name={imageUrl ? d.imgName || "Image" : "No image yet"}
              how={
                imageUrl.startsWith("blob:")
                  ? "Uploads stay in this browser, and the link doesn’t carry them."
                  : imageUrl
                    ? "Shared by all four sizes."
                    : "PNG with a transparent background works best."
              }
            >
              <button className="btn btn-sm" type="button" onClick={picker.open}>
                {imageUrl ? "Replace" : "Upload image"}
              </button>
              {imageUrl ? (
                <button
                  className="btn btn-sm danger"
                  type="button"
                  onClick={() => edit({ imgId: "", imgName: "" })}
                >
                  Remove
                </button>
              ) : null}
            </PictureCard>
            <Range
              label="Size, all sizes"
              min={50}
              max={150}
              step={5}
              suffix="%"
              value={clamp(d.imgSize, 50, 150, 100)}
              onChange={(imgSize) => edit({ imgSize })}
            />
            <Range
              label="Move left / right, all sizes"
              min={-600}
              max={600}
              step={10}
              value={clamp(d.imgX, -600, 600, 0)}
              onChange={(imgX) => edit({ imgX })}
            />
            <Range
              label="Move down / up, all sizes"
              min={-600}
              max={600}
              step={10}
              value={clamp(d.imgY, -600, 600, 0)}
              onChange={(imgY) => edit({ imgY })}
            />
            <Switch checked={!!d.flip} onChange={(flip) => edit({ flip })}>
              Flip the image
            </Switch>

            <div className="sub-box">
              <h3>
                Adjust for this size <span className="tag">{active}</span>
              </h3>
              <Range
                label="Size"
                min={25}
                max={200}
                step={5}
                suffix="%"
                value={fit.size}
                onChange={(size) => editFit({ size })}
              />
              <Range
                label="Move left / right"
                min={-600}
                max={600}
                step={10}
                value={fit.x}
                onChange={(x) => editFit({ x })}
              />
              <Range
                label="Move down / up"
                min={-600}
                max={600}
                step={10}
                value={fit.y}
                onChange={(y) => editFit({ y })}
              />
              <Range
                label="Rotate"
                min={-180}
                max={180}
                step={1}
                suffix="°"
                value={fit.r}
                onChange={(r) => editFit({ r })}
              />
              <div className="actions">
                <button className="btn btn-sm" type="button" onClick={resetFit}>
                  Reset this size
                </button>
              </div>
            </div>
          </Section>

          <Section title="Layout">
            <Range
              label="Grid size"
              min={24}
              max={160}
              step={4}
              suffix="px"
              value={clamp(d.gridSize, 24, 160, 64)}
              onChange={(gridSize) => edit({ gridSize })}
            />
            <Switch checked={d.showRip !== false} onChange={(showRip) => edit({ showRip })}>
              Paper rip
            </Switch>
            <Switch checked={d.showLogo !== false} onChange={(showLogo) => edit({ showLogo })}>
              Build mode logo
            </Switch>
            <Range
              label="Logo size"
              min={60}
              max={167}
              step={1}
              suffix="px"
              value={clamp(d.logoSize, 60, 167, 120)}
              onChange={(logoSize) => edit({ logoSize })}
            />
            <Hint>
              Substack never shows the logo, author or paper rip. Website never shows the author or
              paper rip.
            </Hint>
          </Section>

          <ImageActions key={current.id} onDuplicate={store.duplicate} onDelete={store.remove} />
        </>
      }
    />
  )
}

function Avatar({ name }: { name: string }) {
  const src = ASSETS.authors[name]
  return <div className="avatar">{src ? <img src={src} alt="" /> : null}</div>
}
