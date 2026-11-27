import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { HoggieGallery } from "../../editor/HoggieGallery.tsx"
import { ImageActions, ImageList, MakerFrame } from "../../editor/MakerFrame.tsx"
import { PaintedCanvas } from "../../editor/PaintedCanvas.tsx"
import {
  BOLD,
  MEDIUM,
  REGULAR,
  type Rect,
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
  Segmented,
  Swatches,
  Switch,
  TextField,
} from "../../editor/fields.tsx"
import { CloseIcon, DownloadIcon } from "../../editor/icons.tsx"
import { useImageStore, useNewImageLinks } from "../../editor/store.ts"
import { drawPost, imagesOf } from "./draw.ts"
import {
  AUTO,
  type BlogDoc,
  COLOR_KEYS,
  H,
  HL,
  MAX_AUTHORS,
  SEO_AUTHOR,
  SEO_COLORS,
  TONES,
  type Tone,
  W,
  authorLabel,
  authorsOf,
  blank,
  fresh,
  highlightIndex,
  hlKeysFor,
  hogUrl,
  hogs,
  isAuto,
  plainTitle,
  readLinkRequest,
  resolvedHog,
  seoHogs,
  toneEdit,
} from "./model.ts"

const SLUG = "blog"

const thumb = (d: BlogDoc) => ({
  width: W,
  height: H,
  paint: (ctx: CanvasRenderingContext2D) => void drawPost(ctx, d),
})

const TONE_HINT: Record<Tone, string> = {
  light: "The 300 tone under a 70% white wash.",
  mid: "The 500 tone, full strength.",
  dark: "The 700 tone under a 70% dark wash, with white text.",
}

const swatchLabel = (k: string) => k.replace("-", " ")

export default function BlogMaker() {
  const store = useImageStore(SLUG, blank)
  const { current, edit, setStatus } = store
  const d = current.data
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [scale, setScale] = useState<1 | 2>(1)

  // The text the drawings use, so RoundHog's faces for it are loaded.
  const allText = store.items
    .map((it) => it.data.title + it.data.sub + authorsOf(it.data).join(""))
    .join("")
  useEffect(() => requestFonts([REGULAR, MEDIUM, SEMIBOLD, BOLD], allText), [allText])

  // ---- `#new-<hex>` links make an image, or open the one they made before ----
  useNewImageLinks(store, readLinkRequest, plainTitle)

  // ---- Stage ----
  const hit = useRef<Rect | null>(null)
  const paintStage = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      hit.current = drawPost(ctx, d).hit
    },
    [d],
  )

  // ---- Download ----
  const download = () => {
    const filename = `${slugify(plainTitle(d), "blog-image")}${scale === 2 ? "@2x" : ""}.png`
    downloadPng(SLUG, {
      width: W,
      height: H,
      scale,
      filename,
      images: imagesOf(d),
      draw: (ctx) => drawPost(ctx, d),
    }).then(
      () => setStatus(`Downloaded ${filename}`),
      () => setStatus("Couldn’t make the PNG. Try again."),
    )
  }

  // ---- Settings ----
  const seo = !!d.seo
  const tone: Tone = d.tone || "light"
  const auto = isAuto(d)
  const hog = resolvedHog(d)
  const hl = highlightIndex(d)
  const coAuthors = (d.coAuthors ?? []).slice(0, MAX_AUTHORS - 1)
  // The co-author row just added gets focus (once, on that image).
  const [added, setAdded] = useState<{ id: string; i: number } | null>(null)
  const seoNames = useMemo(() => (seo ? seoHogs() : undefined), [seo])

  const setSeo = (on: boolean) => {
    if (!on) return edit({ seo: false })
    const a = String(d.author || "").trim()
    edit(!a || a === "First Last" ? { seo: true, author: SEO_AUTHOR } : { seo: true })
  }
  const setTone = (next: Tone) => {
    if (next === d.tone) return
    // Midtone starts with white text and a white highlight.
    edit(
      next === "mid"
        ? { tone: "mid", midText: "white", highlight: "white" }
        : toneEdit(d, { tone: next }),
    )
  }

  return (
    <MakerFrame
      slug={SLUG}
      engine="blog"
      title="Blog images"
      lede="Post and newsletter headers with a highlighted phrase, the author and a hoggie matched to the title."
      docName={plainTitle(d)}
      image={d}
      status={store.status}
      downloads={
        <>
          <select
            aria-label="Download size"
            title="Download size"
            value={scale}
            onChange={(e) => setScale(e.target.value === "2" ? 2 : 1)}
          >
            <option value="1">1920 × 1080</option>
            <option value="2">3840 × 2160 (2×)</option>
          </select>
          <button className="btn btn-primary" type="button" onClick={download}>
            <DownloadIcon />
            Download PNG
          </button>
        </>
      }
      list={
        <ImageList
          label="Blog images"
          items={store.items}
          currentId={current.id}
          onSelect={store.select}
          onNew={() => store.add(fresh())}
          thumb={thumb}
          title={plainTitle}
          byline={authorLabel}
        />
      }
      stage={
        <>
          <div className="canvas-wrap">
            <PaintedCanvas
              width={W}
              height={H}
              paint={paintStage}
              aria-label="Blog image preview"
              onPointerMove={(e) => {
                const p = toUnits(e, e.currentTarget, W, H)
                e.currentTarget.style.cursor = inRect(p, hit.current) ? "pointer" : "default"
              }}
              onClick={(e) => {
                if (inRect(toUnits(e, e.currentTarget, W, H), hit.current)) setGalleryOpen(true)
              }}
            />
          </div>
          <p className="stage-hint">Click the hoggie on the image to choose a different one.</p>
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
              hint={<Hint>Lines wrap on their own. Press Enter to force a line break.</Hint>}
            />
            {/* No description field: `description` comes only from a link (`#new-…` or
                `?image=`), isn't drawn, and only helps the automatic hoggie match. */}
            <TextField
              label="Highlight"
              placeholder="A word or phrase from the title"
              value={d.hlText}
              onChange={(hlText) => edit({ hlText })}
              hint={
                !d.hlText.trim() ? (
                  <Hint>Leave empty for no highlight.</Hint>
                ) : hl.found ? (
                  <Hint>Highlighted in the title. Leave empty for no highlight.</Hint>
                ) : (
                  <Hint warn>That text isn’t in the title, so nothing is highlighted.</Hint>
                )
              }
            />
            <SubheadingField key={current.id} value={d.sub} onChange={(sub) => edit({ sub })} />
            <div className="field">
              <Switch checked={seo} onChange={setSeo}>
                SEO / AEO post
              </Switch>
              <Hint>
                {seo
                  ? "SEO / AEO hoggies only, light backgrounds, and the highlight matches the background."
                  : "Limits hoggies and colors to the SEO / AEO set."}
              </Hint>
            </div>
          </Section>

          <Section title="Authors">
            <Field
              label="Author"
              hint={
                <Hint>
                  {coAuthors.length >= MAX_AUTHORS - 1
                    ? "That’s the most that fit: 3 authors."
                    : "Each author gets their own line, up to 3."}
                </Hint>
              }
            >
              {(id) => (
                <>
                  <input
                    id={id}
                    className="input"
                    type="text"
                    autoComplete="off"
                    placeholder="First Last"
                    value={d.author}
                    onChange={(e) => edit({ author: e.target.value })}
                  />
                  {coAuthors.length ? (
                    <div className="co-authors">
                      {coAuthors.map((name, i) => (
                        <div className="co-row" key={i}>
                          <input
                            className="input"
                            type="text"
                            autoComplete="off"
                            placeholder="First Last"
                            aria-label={`Author ${i + 2}`}
                            autoFocus={added?.id === current.id && added.i === i}
                            value={name}
                            onChange={(e) =>
                              edit((cur) => {
                                const a = [...(cur.coAuthors ?? [])]
                                a[i] = e.target.value
                                return { coAuthors: a }
                              })
                            }
                          />
                          <button
                            type="button"
                            className="icon-btn"
                            aria-label={`Remove author ${i + 2}`}
                            onClick={() => {
                              setAdded(null)
                              edit((cur) => ({
                                coAuthors: (cur.coAuthors ?? []).filter((_, j) => j !== i),
                              }))
                            }}
                          >
                            <CloseIcon />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {coAuthors.length < MAX_AUTHORS - 1 ? (
                    <div className="actions">
                      <button
                        className="btn btn-sm"
                        type="button"
                        onClick={() => {
                          setAdded({ id: current.id, i: coAuthors.length })
                          edit((cur) => ({ coAuthors: [...(cur.coAuthors ?? []), ""] }))
                        }}
                      >
                        Add another author
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </Field>
          </Section>

          <Section title="Hoggie">
            <PictureCard
              kind="hog-card"
              picture={hogUrl(hog) ? <img src={hogUrl(hog)} alt="" /> : null}
              pictureLabel="Choose hoggie"
              onPictureClick={() => setGalleryOpen(true)}
              name={hog}
              how={auto ? "Picked from your title" : "Chosen by you"}
            >
              <button className="btn btn-sm" type="button" onClick={() => setGalleryOpen(true)}>
                {auto ? "Choose a different one" : "Change"}
              </button>
            </PictureCard>
            <Switch checked={auto} onChange={(on) => edit({ hog: on ? AUTO : resolvedHog(d) })}>
              Match the title automatically
            </Switch>
            <Range
              label="Size"
              min={75}
              max={125}
              step={5}
              suffix="%"
              value={clamp(d.hogSize, 75, 125, 100)}
              onChange={(hogSize) => edit({ hogSize })}
            />
            <Range
              label="Move left / right"
              min={-20}
              max={20}
              step={1}
              value={clamp(d.hogX, -20, 20, 0)}
              onChange={(hogX) => edit({ hogX })}
            />
            <Range
              label="Move down / up"
              min={-20}
              max={20}
              step={1}
              value={clamp(d.hogY, -20, 20, 0)}
              onChange={(hogY) => edit({ hogY })}
            />
            <Switch checked={!!d.flip} onChange={(flip) => edit({ flip })}>
              Flip to face the other way
            </Switch>
          </Section>

          <Section title="Colors">
            <Swatches
              label="Background"
              options={(seo ? SEO_COLORS : COLOR_KEYS).map((k) => ({
                key: k,
                color: TONES[k][1],
                label: swatchLabel(k),
              }))}
              value={seo && !SEO_COLORS.includes(d.color) ? "tangerine" : d.color}
              onChange={(color) => edit({ color })}
            />
            {seo ? null : (
              <>
                <Segmented
                  label="Tone"
                  options={[
                    { value: "light", label: "Light" },
                    { value: "mid", label: "Midtone" },
                    { value: "dark", label: "Dark" },
                  ]}
                  value={tone}
                  onChange={setTone}
                  hint={<Hint>{TONE_HINT[tone]}</Hint>}
                />
                {tone === "mid" ? (
                  <Segmented
                    label="Text on midtone"
                    options={[
                      { value: "dark", label: "Dark" },
                      { value: "white", label: "White" },
                    ]}
                    value={d.midText || "dark"}
                    onChange={(midText) => edit(toneEdit(d, { midText }))}
                  />
                ) : null}
                <Swatches
                  label="Highlight"
                  options={hlKeysFor(d).map((k) => ({
                    key: k,
                    color: HL[k][0],
                    label: swatchLabel(k),
                  }))}
                  value={d.highlight}
                  onChange={(highlight) => edit({ highlight })}
                />
              </>
            )}
          </Section>

          <ImageActions key={current.id} onDuplicate={store.duplicate} onDelete={store.remove} />
        </>
      }
    >
      <HoggieGallery
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        hogs={hogs()}
        names={seoNames}
        selected={auto ? null : d.hog}
        autoLabel={AUTO}
        onPick={(name) => edit({ hog: name ?? AUTO })}
      />
    </MakerFrame>
  )
}

/**
 * Subheadings are retired for new images: the field only shows on images that already have one,
 * and stays while it's being edited (keyed per image, so clearing it hides it next time).
 */
function SubheadingField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [shown] = useState(() => !!String(value || "").trim())
  if (!shown) return null
  return (
    <TextField
      label={
        <>
          Subheading <span className="hint">(optional)</span>
        </>
      }
      rows={2}
      value={value}
      onChange={onChange}
      hint={
        <Hint>Wrap words in **double asterisks** to make them bold. Leave empty to hide it.</Hint>
      }
    />
  )
}
