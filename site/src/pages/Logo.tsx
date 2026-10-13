import { colors } from "@posthog/brand/colors"
import { Logo } from "@posthog/brand/logo"
import type { LogoHoliday, LogoLayout, LogomarkHandle, LogoVariant } from "@posthog/brand/logo"
import type { ReactNode } from "react"
import { useLayoutEffect, useRef, useState } from "react"
import { logoFilePath } from "../agent-paths.ts"
import { track } from "../analytics.ts"
import { CodeBlock } from "../components/CodeBlock.tsx"
import { useAssetCopy } from "../components/CopyMenu.tsx"
import { PageHeader } from "../components/PageHeader.tsx"
import {
  LOGO_BLACK,
  LOGO_DONTS,
  LOGO_DOS,
  LOGO_PRESETS,
  LOGO_WHITE,
  type LogoFile,
  type LogoPreset,
} from "../logo-files.ts"
import { frameSide, PNG_SCALES, standaloneSvg, svgToPng, type ExportFrame } from "../svg-export.ts"
import { useSeo } from "../useSeo.ts"

// The page follows the brand handbook (posthog.com/handbook/brand/assets): first the approved
// logo versions as presets, each with when to use it and a one-click export; then the do's and
// don'ts; then — collapsed, for when no preset fits — a builder for any layout, color, canvas,
// or holiday; and last the React API behind all of it.
//
// The package ships the logo only as a component, so every PNG/SVG here is snapshotted from
// what `<Logo>` rendered on the page (see svg-export.ts). A square/circle `frame` grows the
// snapshot to a padded canvas, and a dashed guide previews the crop with the same math.

const IMPORT_LINE = `import { Logo } from "@posthog/brand/logo"`

// ---- Export -------------------------------------------------------------------------------

/**
 * Snapshot export for the logo rendered inside `stage`: copy/download as PNG or SVG through
 * the shared copy menu, optionally on a padded `frame`. `guide` is the frame's on-screen side,
 * for the crop preview; it's re-measured whenever `frame` or `measureKey` changes.
 */
function useLogoExport({
  frame,
  fileName,
  usage,
  measureKey = "",
}: {
  frame?: ExportFrame
  fileName: string
  usage?: string
  measureKey?: string
}) {
  const stage = useRef<HTMLDivElement>(null)
  const [guide, setGuide] = useState<number>()
  useLayoutEffect(() => {
    const svg = stage.current?.querySelector("svg")
    if (!frame || !svg) return setGuide(undefined)
    const { width, height } = svg.getBoundingClientRect()
    setGuide(frameSide(width, height, frame))
  }, [frame, measureKey])
  const snapshot = () => {
    const svg = stage.current?.querySelector("svg")
    if (!svg) throw new Error("No logo rendered")
    return standaloneSvg(svg, frame)
  }
  const copy = useAssetCopy({
    asset: { type: "logo", slug: fileName },
    importLine: IMPORT_LINE,
    usage,
    fileName,
    svg: async () => snapshot().markup,
    png: async (scale?: number) => {
      const { markup, width, height } = snapshot()
      return svgToPng(markup, width, height, scale)
    },
    pngScales: PNG_SCALES,
  })
  return { stage, guide, copy }
}

/** Wraps the logo in the dashed crop guide when it's exported on a padded frame. */
function Framed({
  frame,
  guide,
  children,
}: {
  frame?: ExportFrame
  guide?: number
  children: ReactNode
}) {
  if (!frame) return children
  return (
    <span
      className={`frame-guide${frame === "circle" ? " circle" : ""}`}
      style={guide ? { width: guide, height: guide } : undefined}
    >
      {children}
    </span>
  )
}

/**
 * The clickable logo: click copies the PNG, right-click opens every format (SVG, JSX, a
 * download). The outcome flashes over the logo — tangerine when it worked, coral when it
 * didn't — and fades as the copy status clears.
 */
function CopyStage({
  exp: { stage, guide, copy },
  frame,
  dark,
  stageClassName = "",
  title,
  children,
}: {
  exp: ReturnType<typeof useLogoExport>
  frame?: ExportFrame
  dark?: boolean
  stageClassName?: string
  title: string
  children: ReactNode
}) {
  const status = copy.status
  return (
    <>
      <button
        type="button"
        className="copy-stage"
        onClick={copy.onClick}
        onContextMenu={copy.onContextMenu}
        title={title}
      >
        <div ref={stage} className={`logo-stage ${stageClassName}${dark ? " dark" : ""}`}>
          <Framed frame={frame} guide={guide}>
            {children}
          </Framed>
        </div>
        <span
          className={`copy-flash${status ? " show" : ""}${status && !status.ok ? " failed" : ""}`}
          aria-live="polite"
        >
          {status?.label}
        </span>
      </button>
      {copy.menu}
    </>
  )
}

// ---- Presets ------------------------------------------------------------------------------

/** Renders one logo file at `size`, the same props its `jsx` spells out. */
function LogoForFile({ file, size }: { file: LogoFile; size: number }) {
  const { layout, treatment, title } = file
  const color = treatment === "black" ? LOGO_BLACK : treatment === "white" ? LOGO_WHITE : undefined
  const variant = color ? "mono" : treatment === "print" ? "print" : "gradient"
  if (layout === "logomark") {
    return <Logo.Logomark size={size} variant={variant} color={color} title={title} />
  }
  if (layout === "wordmark") return <Logo.Wordmark size={size} color={color} title={title} />
  return <Logo size={size} layout={layout} variant={variant} color={color} title={title} />
}

/** A preset: the copyable logo, its name, and when to use it. */
function PresetCard({ preset }: { preset: LogoPreset }) {
  const { name, when, file, size } = preset
  const exp = useLogoExport({ frame: file.frame, fileName: file.id, usage: file.jsx })
  return (
    <div className="card preset">
      <CopyStage
        exp={exp}
        frame={file.frame}
        dark={file.treatment === "white"}
        title={`${file.id} — click to copy the PNG; right-click for SVG, JSX, or download`}
      >
        <LogoForFile file={file} size={size} />
      </CopyStage>
      <div className="preset-body">
        <h3>{name}</h3>
        <p>{when}</p>
        <p className="preset-files">
          <a
            href={logoFilePath(file.id, "svg")}
            download
            onClick={() => trackFileLink(file, "svg")}
          >
            SVG
          </a>{" "}
          ·{" "}
          <a
            href={logoFilePath(file.id, "png")}
            download
            onClick={() => trackFileLink(file, "png")}
          >
            PNG
          </a>
        </p>
      </div>
    </div>
  )
}

function trackFileLink(file: LogoFile, format: "svg" | "png") {
  track("asset downloaded", {
    asset_type: "logo",
    asset_slug: file.id,
    format,
    source: "link",
  })
}

// ---- Guidelines ---------------------------------------------------------------------------

function Guidelines() {
  return (
    <>
      <div className="guidelines">
        <div className="card guideline do">
          <h3>Do</h3>
          <ul>
            {LOGO_DOS.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="card guideline dont">
          <h3>Don't</h3>
          <ul>
            {LOGO_DONTS.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="card guideline third-party">
        <h3>Using the logo outside PostHog</h3>
        <ul>
          <li>
            Say your product <em>works with</em>, is <em>built for</em>, or is <em>built on</em>{" "}
            PostHog — never that it's official or endorsed. “Desktop Studio for PostHog” is fine;
            “Official PostHog Desktop Studio” isn't.
          </li>
          <li>Use the logo unmodified, and never as your project's main branding.</li>
          <li>
            The hedgehogs and other illustrations need explicit permission for commercial or
            marketing use.
          </li>
          <li>
            Questions? <a href="mailto:marketing@posthog.com">marketing@posthog.com</a>
          </li>
        </ul>
      </div>
    </>
  )
}

// ---- Builder ----------------------------------------------------------------------------

/** A labelled segmented control. */
function Seg<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  /** Why this control doesn't apply right now; when set, the control is disabled. */
  disabled?: string
}) {
  return (
    <div className={`builder-control${disabled ? " disabled" : ""}`} title={disabled}>
      <span className="builder-control-label">{label}</span>
      <div className="seg" role="group" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            className={o.value === value ? "active" : undefined}
            aria-pressed={o.value === value}
            disabled={!!disabled}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

type Canvas = "tight" | ExportFrame

/** A mono color choice; `color` is absent for "inherit" (the mark draws `currentColor`). */
interface Tint {
  slug: string
  label: string
  color?: string
}

function hue(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const max = Math.max(r, g, b)
  const d = max - Math.min(r, g, b)
  if (d === 0) return 0
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  // Wrap reds (coral sits at ~358°) to the front, so the row starts red rather than ends.
  return ((h * 60 + 360 + 15) % 360) - 15
}

/** Inherit, white, then every brand color's core tone, in rainbow order. */
const TINTS: Tint[] = [
  { slug: "inherit", label: "Inherit (currentColor)" },
  { slug: "white", label: "White", color: "#fff" },
  ...Object.entries(colors)
    .map(([slug, c]) => ({ slug, label: c.name, color: c.core }))
    .sort((a, b) => hue(a.color) - hue(b.color)),
]

/** A labelled row of round color swatches. */
function Swatches({
  value,
  onChange,
  disabled,
}: {
  value: Tint
  onChange: (tint: Tint) => void
  disabled?: string
}) {
  return (
    <div className={`builder-control${disabled ? " disabled" : ""}`} title={disabled}>
      <span className="builder-control-label">Color</span>
      <div className="swatches" role="group" aria-label="Color">
        {TINTS.map((t) => (
          <button
            key={t.slug}
            type="button"
            className={`swatch-dot${t.color ? "" : " inherit"}${t.slug === value.slug ? " active" : ""}`}
            style={t.color ? { background: t.color } : undefined}
            aria-label={t.label}
            aria-pressed={t.slug === value.slug}
            title={disabled ? undefined : t.label}
            disabled={!!disabled}
            onClick={() => onChange(t)}
          />
        ))}
      </div>
    </div>
  )
}

/** Preview width per layout; smaller on a padded canvas so the crop guide fits the stage. */
const PREVIEW_SIZE: Record<LogoLayout, { tight: number; framed: number }> = {
  landscape: { tight: 240, framed: 160 },
  stacked: { tight: 130, framed: 100 },
  logomark: { tight: 88, framed: 80 },
  wordmark: { tight: 220, framed: 150 },
}

/**
 * Pick a layout, treatment, color, canvas, and (for the logomark) a holiday; see the logo,
 * export exactly that as a PNG/SVG, or copy the JSX that renders it. The logomark and
 * wordmark use their `Logo.*` subcomponents, since that's where the logomark-only props live.
 *
 * The file is snapshotted from the preview (see svg-export.ts) — with a square/circle canvas
 * the padding is baked in, and the dashed guide previews the crop with the same math.
 */
function Builder() {
  const [layout, setLayout] = useState<LogoLayout>("landscape")
  const [variant, setVariant] = useState<LogoVariant>("gradient")
  const [tint, setTint] = useState<Tint>(TINTS[0])
  const [canvas, setCanvas] = useState<Canvas>("tight")
  const [holiday, setHoliday] = useState<LogoHoliday | "none">("none")

  const isMark = layout === "logomark"
  const isWordmark = layout === "wordmark"
  // `color` only means something for mono, and the wordmark is always mono.
  const mono = isWordmark || variant === "mono"
  const color = mono ? tint.color : undefined
  const frame = canvas === "tight" ? undefined : canvas
  const markHoliday = isMark && holiday !== "none" ? holiday : undefined

  const props: string[] = []
  if (!isMark && !isWordmark && layout !== "landscape") props.push(`layout="${layout}"`)
  if (!isWordmark && variant !== "gradient") props.push(`variant="${variant}"`)
  if (color) props.push(`color="${color}"`)
  if (markHoliday) props.push(`holiday="${markHoliday}"`)
  const tag = isMark ? "Logo.Logomark" : isWordmark ? "Logo.Wordmark" : "Logo"
  const jsx = `<${[tag, ...props].join(" ")} />`

  // posthog-logo-stacked-print-square, posthog-logomark-white-christmas-circle, …
  const fileName = [
    isMark ? "posthog-logomark" : isWordmark ? "posthog-wordmark" : `posthog-logo-${layout}`,
    mono ? (tint.color ? tint.slug : "mono") : variant,
    markHoliday,
    frame,
  ]
    .filter(Boolean)
    .join("-")

  const exp = useLogoExport({
    frame,
    fileName,
    usage: jsx,
    measureKey: `${layout}-${markHoliday}`,
  })

  const size = PREVIEW_SIZE[layout][frame ? "framed" : "tight"]
  const title = "PostHog logo — builder preview"
  const preview = isMark ? (
    <Logo.Logomark
      size={size}
      variant={variant}
      color={color}
      holiday={markHoliday}
      title={title}
    />
  ) : isWordmark ? (
    <Logo.Wordmark size={size} color={color} title={title} />
  ) : (
    <Logo layout={layout} variant={variant} color={color} size={size} title={title} />
  )

  return (
    <div className="card builder">
      <div className="builder-controls">
        <Seg
          label="Layout"
          value={layout}
          onChange={setLayout}
          options={[
            { value: "landscape", label: "Landscape" },
            { value: "stacked", label: "Stacked" },
            { value: "logomark", label: "Logomark" },
            { value: "wordmark", label: "Wordmark" },
          ]}
        />
        <Seg
          label="Variant"
          value={variant}
          onChange={setVariant}
          disabled={isWordmark ? "The wordmark is always mono" : undefined}
          options={[
            { value: "gradient", label: "Full color" },
            { value: "print", label: "Print" },
            { value: "mono", label: "Mono" },
          ]}
        />
        <Swatches
          value={tint}
          onChange={setTint}
          disabled={mono ? undefined : "Color applies to the mono variant and the wordmark"}
        />
        <Seg
          label="Canvas"
          value={canvas}
          onChange={setCanvas}
          options={[
            { value: "tight", label: "Tight" },
            { value: "square", label: "Square" },
            { value: "circle", label: "Circle" },
          ]}
        />
        <Seg
          label="Holiday"
          value={holiday}
          onChange={setHoliday}
          disabled={isMark ? undefined : "Holidays dress up the logomark only"}
          options={[
            { value: "none", label: "None" },
            { value: "christmas", label: "Christmas" },
            { value: "halloween", label: "Halloween" },
          ]}
        />
      </div>

      <CopyStage
        exp={exp}
        frame={frame}
        dark={mono && tint.slug === "white"}
        stageClassName="builder-stage"
        title={`${fileName} — click to copy the PNG; right-click for SVG, JSX, or download`}
      >
        {preview}
      </CopyStage>
      <p className="builder-note">
        {frame ? (
          <>
            Padded for avatar uploads (G2, X, LinkedIn, Reddit, Slack) that crop to a {frame}. The
            dashed line is the crop; the padding is baked into the file, so upload it as-is.
          </>
        ) : (
          <>Cropped tight to the logo, no padding. Pick Square or Circle for profile pictures.</>
        )}{" "}
        Saves as <code>{fileName}</code>.
      </p>
      <CodeBlock code={`${IMPORT_LINE}\n\n${jsx}`} />
    </div>
  )
}

// ---- React API --------------------------------------------------------------------------

const PROPS: { name: string; type: string; def?: string; note: ReactNode }[] = [
  {
    name: "layout",
    type: `"landscape" | "stacked" | "logomark" | "wordmark"`,
    def: `"landscape"`,
    note: (
      <>
        The lockup. <code>Logo.Logomark</code> / <code>Logo.Wordmark</code> are shorthands for the
        last two.
      </>
    ),
  },
  {
    name: "variant",
    type: `"gradient" | "print" | "mono"`,
    def: `"gradient"`,
    note: "Full color, flat 4-color for print, or a single color.",
  },
  {
    name: "color",
    type: "string",
    def: "currentColor",
    note: (
      <>
        Any CSS color, for <code>mono</code> and the wordmark. Ignored otherwise.
      </>
    ),
  },
  {
    name: "size",
    type: "number",
    def: "100%",
    note: "Width in px; height follows the aspect ratio.",
  },
  { name: "title", type: "string", note: "Accessible label. Without one the logo is decorative." },
]

const LOGOMARK_PROPS: typeof PROPS = [
  {
    name: "holiday",
    type: `"christmas" | "halloween"`,
    note: "Adds a seasonal hat. Nothing switches by date.",
  },
  {
    name: "jumpOnClick",
    type: "boolean",
    def: "false",
    note: "Jump when clicked; rapid clicks jump higher.",
  },
  { name: "autoJumpMs", type: "number", note: "Jump every this-many milliseconds." },
  { name: "jumpHeight", type: "number", def: "12", note: "Jump height, in viewBox units." },
  { name: "airtimeMs", type: "number", def: "400", note: "Duration of one jump." },
  {
    name: "ref",
    type: "LogomarkHandle",
    note: (
      <>
        <code>ref.current.jump(magnitude?)</code> jumps it from your own code.
      </>
    ),
  },
]

function PropsTable({ rows }: { rows: typeof PROPS }) {
  return (
    <div className="card props-table">
      <table>
        <thead>
          <tr>
            <th>Prop</th>
            <th>Type</th>
            <th>Default</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.name}>
              <td>
                <code>{p.name}</code>
              </td>
              <td>
                <code>{p.type}</code>
              </td>
              <td>{p.def ? <code>{p.def}</code> : "—"}</td>
              <td>{p.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const IMPERATIVE_CODE = `import { useRef } from "react"
import { Logo, type LogomarkHandle } from "@posthog/brand/logo"

const mark = useRef<LogomarkHandle>(null)

<Logo.Logomark ref={mark} />
<button onClick={() => mark.current?.jump()}>Jump</button>
<button onClick={() => mark.current?.jump(4)}>Jump higher</button>`

/** The imperative handle: jump the mark from buttons outside it. */
function ImperativeJump() {
  const mark = useRef<LogomarkHandle>(null)
  return (
    <div className="imperative-jump">
      <div className="card logo-stage imperative-jump-stage">
        <Logo.Logomark ref={mark} size={64} title="PostHog logomark — jump from a button" />
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="btn btn-primary" onClick={() => mark.current?.jump()}>
            Jump
          </button>
          <button type="button" className="btn" onClick={() => mark.current?.jump(4)}>
            Jump higher
          </button>
        </div>
      </div>
      <CodeBlock code={IMPERATIVE_CODE} />
    </div>
  )
}

const REACT_EXAMPLE = `${IMPORT_LINE}

<Logo />                              // standard
<Logo variant="mono" color="#fff" />  // light, for dark backgrounds
<Logo layout="stacked" />             // stacked
<Logo.Logomark size={32} />           // logomark, 32px wide`

function ReactSection() {
  return (
    <>
      <p className="section-lede">
        Every logo on this page is one <code>&lt;Logo&gt;</code> component — right-click a preset
        for its JSX, or build one above.
      </p>
      <CodeBlock code={REACT_EXAMPLE} />

      <h3 className="props-subhead">Props</h3>
      <PropsTable rows={PROPS} />
      <h3 className="props-subhead">
        <code>Logo.Logomark</code> only
      </h3>
      <PropsTable rows={LOGOMARK_PROPS} />
      <p className="section-lede">
        Every native <code>&lt;svg&gt;</code> prop (<code>className</code>, <code>style</code>,{" "}
        <code>onClick</code>, …) works too.
      </p>

      <h3 className="props-subhead">Jump from your own code</h3>
      <p className="section-lede">
        The logomark's <code>ref</code> is a <code>LogomarkHandle</code>: call <code>jump()</code>{" "}
        from anywhere, with an optional magnitude.
      </p>
      <ImperativeJump />
    </>
  )
}

// ---- Page -------------------------------------------------------------------------------

export function LogoPage() {
  useSeo("/logo")

  return (
    <div>
      <PageHeader eyebrow="@posthog/brand/logo" title="Logo">
        The approved PostHog logos and when to use each. Click one to copy a PNG, or right-click for
        the SVG, JSX, or a download.
      </PageHeader>

      <section className="section">
        <h2>Presets</h2>
        <div className="grid grid-presets">
          {LOGO_PRESETS.map((preset) => (
            <PresetCard key={preset.file.id} preset={preset} />
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Guidelines</h2>
        <Guidelines />
      </section>

      <details className="logo-group section" open>
        <summary>
          <h2>None of these fit? Build a custom logo</h2>
        </summary>
        <p className="section-lede">
          Any layout, a single brand color, a padded square or circle canvas, or a holiday hat —
          exported as a PNG or SVG, or as the JSX that renders it.
        </p>
        <Builder />
      </details>

      <section className="section">
        <h2>Use it in React</h2>
        <ReactSection />
      </section>
    </div>
  )
}
