import { useCallback, useEffect, useId, useRef, useState } from "react"
import { HoggieGallery } from "../../editor/HoggieGallery.tsx"
import { ImageActions, ImageList, MakerFrame } from "../../editor/MakerFrame.tsx"
import { PaintedCanvas } from "../../editor/PaintedCanvas.tsx"
import {
  BOLD,
  type Rect,
  SEMIBOLD,
  clamp,
  imagesReady,
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
} from "../../editor/fields.tsx"
import { DownloadIcon } from "../../editor/icons.tsx"
import { useImageStore } from "../../editor/store.ts"
import { makerHoggies } from "../../hoggies.ts"
import { MIN_WIDTH, drawPost, imagesOf } from "./draw.ts"
import {
  AUTO,
  COLOR_KEYS,
  CUSTOMERS,
  type Customer,
  type CustomerDoc,
  H,
  TONES,
  type Tone,
  W,
  blank,
  customerFor,
  customerKeys,
  displayName,
  hogUrl,
  isAuto,
  key,
  logoInfo,
  logoLabel,
  look,
  parseCompany,
  readLinkRequest,
  resolvedHog,
  searchCustomers,
} from "./model.ts"

const SLUG = "customer-stories"

const thumb = (d: CustomerDoc) => ({
  width: W,
  height: H,
  paint: (ctx: CanvasRenderingContext2D) => void drawPost(ctx, d),
})

/** The answer under the company field after "Find logo", with choices when it's unsure. */
interface FindResult {
  cls: "" | "ok" | "miss"
  text: string
  picks?: Customer[]
}
const NO_RESULT: FindResult = { cls: "", text: "" }

function toneHint(chosen: Tone, shown: Tone): string {
  if (chosen === "dark" && shown !== "dark")
    return "This color has no dark tone, so it shows as Midtone."
  if (shown === "light") return "The 300 tone under a 70% white wash."
  if (shown === "dark") return "The 700 tone under a 70% dark wash."
  return "The 500 tone, full strength."
}

export default function CustomerMaker() {
  const store = useImageStore(SLUG, blank)
  const { current, edit, setStatus, select, add } = store
  const d = current.data
  const L = look(d)
  const li = logoInfo(d, L.lightText)
  const hogName = resolvedHog(d)
  const auto = isAuto(d)
  const tone: Tone = d.tone === "light" || d.tone === "dark" ? d.tone : "mid"

  // The text the drawings use, so RoundHog's faces for it are loaded.
  const allText = store.items.map((it) => displayName(it.data)).join("")
  useEffect(() => requestFonts([SEMIBOLD, BOLD], `Customer story${allText}`), [allText])

  // ---- Find logo ----
  const [find, setFind] = useState<FindResult>(NO_RESULT)
  const [finding, setFinding] = useState(false)
  const findTimer = useRef(0)
  const latestDoc = useRef(d)
  latestDoc.current = d
  useEffect(() => () => window.clearTimeout(findTimer.current), [])

  const runFind = useCallback(() => {
    const company = latestDoc.current.company
    const name = parseCompany(company).display
    if (!String(company ?? "").trim()) {
      setFind({ cls: "miss", text: "Type a company name or website first." })
      return
    }
    setFinding(true)
    setFind({
      cls: "",
      text: `Looking for “${name}” in the ${CUSTOMERS.filter((c) => c.light).length} posthog.com/customers logos…`,
    })
    window.clearTimeout(findTimer.current)
    findTimer.current = window.setTimeout(() => {
      setFinding(false)
      const r = searchCustomers(latestDoc.current.company)
      if (r.exact?.light) {
        edit({ lib: r.exact.slug, upload: null })
        setFind({
          cls: "ok",
          text: `Found ${r.exact.name} on posthog.com/customers. Its logo is on the image.`,
        })
      } else if (r.exact) {
        edit({ lib: "" })
        setFind({
          cls: "miss",
          text: `${r.exact.name} is on posthog.com/customers, but its logo isn’t in this app yet. Upload it below.`,
        })
      } else if (r.near.length) {
        edit({ lib: "" })
        setFind({
          cls: "miss",
          text: `No exact match for “${name}”. Did you mean:`,
          picks: r.near.filter((c) => c.light),
        })
      } else {
        edit({ lib: "" })
        setFind({
          cls: "miss",
          text: `“${name}” isn’t on posthog.com/customers, so the image shows the name. Upload their logo below.`,
        })
      }
    }, 350)
  }, [edit])

  // Switching images clears the last lookup's answer.
  useEffect(() => {
    window.clearTimeout(findTimer.current)
    setFinding(false)
    setFind(NO_RESULT)
  }, [current.id])

  // An image made from a `#new-…` link looks its company up when it opens.
  useEffect(() => {
    if (!latestDoc.current.findOnOpen) return
    edit({ findOnOpen: false })
    runFind()
  }, [current.id, edit, runFind])

  // ---- Links that make an image: #new-<hex JSON> ----
  const itemsRef = useRef(store.items)
  itemsRef.current = store.items
  useEffect(() => {
    const apply = () => {
      const req = readLinkRequest(window.location.hash)
      if (!req) return
      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname + window.location.search,
      )
      // Opening the same link again selects the image it already made instead of making a copy.
      const existing = itemsRef.current.find((it) => it.data.linkKey === req.linkKey)
      if (existing) {
        select(existing.id)
        setStatus("Opened the image made from this link")
      } else {
        add(req)
        setStatus(`Made from link: ${displayName(req)}`)
      }
    }
    apply()
    window.addEventListener("hashchange", apply)
    return () => window.removeEventListener("hashchange", apply)
  }, [select, add, setStatus])

  const onCompany = (value: string) => {
    const patch: Partial<CustomerDoc> = { company: value }
    const c = customerFor(d)
    const lookUp = { cls: "", text: `Select Find logo to look up “${value.trim()}”.` } as const
    if (c) {
      if (!customerKeys(c).includes(key(parseCompany(value).stem))) {
        patch.lib = ""
        setFind(lookUp)
      }
    } else if (value.trim()) setFind(lookUp)
    edit(patch)
  }

  // ---- Logo upload ----
  const fileInput = useRef<HTMLInputElement>(null)
  const [uploadMsg, setUploadMsg] = useState("")
  const onUpload = (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setUploadMsg("That logo didn’t upload. Try an SVG under 2 MB or a PNG.")
      return
    }
    setUploadMsg("")
    edit({ upload: { id: URL.createObjectURL(file), name: file.name.replace(/\.[^.]+$/, "") } })
  }

  // ---- Stage ----
  const hit = useRef<Rect | null>(null)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const paintStage = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      hit.current = drawPost(ctx, d).hit
    },
    [d],
  )

  // ---- Download ----
  const sizeId = useId()
  const [scale, setScale] = useState<1 | 2>(1)
  const download = async () => {
    const name = `customer-story-${slugify(displayName(d), "customer-story")}${scale === 2 ? "@2x" : ""}.png`
    try {
      await imagesReady(imagesOf(d), MIN_WIDTH)
      await downloadPng(SLUG, {
        width: W,
        height: H,
        scale,
        filename: name,
        draw: (ctx) => drawPost(ctx, d),
      })
      setStatus(`Downloaded ${name}`)
    } catch {
      setStatus("Couldn’t make the PNG. Try again.")
    }
  }

  // The preview shows the logo file as it is: a dark-mode file on dark, everything else on white.
  const onDark = li.src === "library" && !!li.customer?.dark && li.id === li.customer.dark

  return (
    <MakerFrame
      slug={SLUG}
      engine="customer"
      title="Customer story images"
      lede="Customer story headers with the company’s logo from posthog.com/customers, a hoggie and brand colors."
      docName={displayName(d)}
      status={store.status}
      downloads={
        <>
          <label htmlFor={sizeId} hidden>
            Download size
          </label>
          <select
            id={sizeId}
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
          label="Customer story images"
          items={store.items}
          currentId={current.id}
          onSelect={select}
          onNew={() => add(blank())}
          thumb={thumb}
          title={displayName}
          byline={logoLabel}
        />
      }
      stage={
        <>
          <div className="canvas-wrap">
            <PaintedCanvas
              width={W}
              height={H}
              paint={paintStage}
              aria-label="Customer story image preview"
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
          <Section title="Customer">
            <Field
              label="Company"
              hint={
                <>
                  <Hint>
                    Type the name or paste their website, then select Find logo to look it up in the
                    posthog.com/customers logos.
                  </Hint>
                  <div
                    className={find.cls ? `find-result ${find.cls}` : "find-result"}
                    aria-live="polite"
                  >
                    {find.text ? <span>{find.text}</span> : null}
                    {find.picks?.length ? (
                      <div className="picks">
                        {find.picks.map((c) => (
                          <button
                            key={c.slug}
                            type="button"
                            className="btn btn-sm"
                            onClick={() => {
                              edit({ company: c.name, lib: c.slug, upload: null })
                              setFind({
                                cls: "ok",
                                text: `Found ${c.name} on posthog.com/customers. Its logo is on the image.`,
                              })
                            }}
                          >
                            {c.name}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </>
              }
            >
              {(id) => (
                <div className="find-row">
                  <input
                    id={id}
                    className="input"
                    type="text"
                    autoComplete="off"
                    placeholder="Name or website, e.g. Supabase"
                    value={d.company ?? ""}
                    onChange={(e) => onCompany(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        runFind()
                      }
                    }}
                  />
                  <button
                    className="btn btn-sm primary"
                    type="button"
                    disabled={finding}
                    onClick={runFind}
                  >
                    {finding ? "Looking…" : "Find logo"}
                  </button>
                </div>
              )}
            </Field>

            <div className="field">
              <span className="lbl">Logo</span>
              <div className="logo-status">
                <span className={onDark ? "lp dark" : "lp"}>
                  {li.id ? <img src={li.id} alt="" /> : <span>No logo</span>}
                </span>
                <div className="info">
                  <span className="hint">
                    {li.src === "upload"
                      ? `Your uploaded logo${d.upload?.name ? ` (${d.upload.name})` : ""}.`
                      : li.src === "library"
                        ? `From posthog.com/customers: ${li.customer!.name}.`
                        : String(d.company ?? "").trim()
                          ? "No logo yet, so the image shows the name. Select Find logo, or upload one."
                          : "Type a company, then select Find logo."}
                  </span>
                </div>
              </div>
              <div className="actions">
                <button
                  className="btn btn-sm"
                  type="button"
                  onClick={() => fileInput.current?.click()}
                >
                  {li.src === "upload"
                    ? "Upload a different logo"
                    : li.src === "library"
                      ? "Upload your own instead"
                      : "Upload a logo"}
                </button>
                {li.src === "upload" ? (
                  <button
                    className="btn btn-sm"
                    type="button"
                    onClick={() => {
                      setUploadMsg("")
                      edit({ upload: null })
                    }}
                  >
                    {li.customer ? "Use the posthog.com logo" : "Remove upload"}
                  </button>
                ) : null}
              </div>
              <input
                ref={fileInput}
                type="file"
                accept="image/svg+xml,image/png,image/webp,image/jpeg"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  e.target.value = ""
                  onUpload(file)
                }}
              />
              {uploadMsg ? <Hint>{uploadMsg}</Hint> : null}
            </div>

            <Segmented
              label="Logo color"
              options={[
                { value: "match", label: "Match text" },
                { value: "original", label: "Original colors" },
              ]}
              value={li.mode}
              onChange={(logoMode) => edit({ logoMode })}
              hint={
                <Hint>
                  {li.mode === "match"
                    ? "One solid color, the same as the text."
                    : "The logo’s own colors. Check it reads on this background."}
                </Hint>
              }
            />
            <Range
              label="Logo size"
              min={50}
              max={130}
              step={5}
              suffix="%"
              value={clamp(d.logoSize, 50, 130, 100)}
              onChange={(logoSize) => edit({ logoSize })}
            />
          </Section>

          <Section title="Hoggie">
            <PictureCard
              kind="hog-card"
              picture={hogUrl(hogName) ? <img src={hogUrl(hogName)} alt="" /> : null}
              pictureLabel="Choose hoggie"
              onPictureClick={() => setGalleryOpen(true)}
              name={hogName}
              how={auto ? "Picked from the company" : "Chosen by you"}
            >
              <button className="btn btn-sm" type="button" onClick={() => setGalleryOpen(true)}>
                {auto ? "Choose a different one" : "Change"}
              </button>
            </PictureCard>
            <Switch checked={auto} onChange={(on) => edit({ hog: on ? AUTO : resolvedHog(d) })}>
              Match the company automatically
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
              options={COLOR_KEYS.map((k) => ({
                key: k,
                color: TONES[k][1],
                label: k.replace("-", " "),
              }))}
              value={TONES[d.color] ? d.color : "blue"}
              onChange={(color) => edit({ color })}
            />
            <Segmented
              label="Tone"
              options={[
                { value: "light", label: "Light" },
                { value: "mid", label: "Midtone" },
                { value: "dark", label: "Dark" },
              ]}
              value={tone}
              onChange={(t) => edit({ tone: t })}
              hint={<Hint>{toneHint(tone, L.tone)}</Hint>}
            />
            <Segmented
              label="Text"
              options={[
                { value: "dark", label: "Dark" },
                { value: "light", label: "White" },
              ]}
              value={d.ink === "dark" ? "dark" : "light"}
              onChange={(ink) => edit({ ink })}
            />
          </Section>

          <ImageActions key={current.id} onDuplicate={store.duplicate} onDelete={store.remove} />
        </>
      }
    >
      <HoggieGallery
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        hogs={makerHoggies()}
        selected={auto ? null : d.hog}
        autoLabel={AUTO}
        placeholder="Search: music, money, coffee, detective…"
        onPick={(name) => edit({ hog: name ?? AUTO })}
      />
    </MakerFrame>
  )
}
