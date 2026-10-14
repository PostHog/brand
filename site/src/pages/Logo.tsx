import { colors } from "@posthog/brand/colors"
import { Logo } from "@posthog/brand/logo"
import type { LogoHoliday, LogoLayout, LogomarkHandle, LogoVariant } from "@posthog/brand/logo"
import type { ReactNode } from "react"
import { useLayoutEffect, useRef, useState } from "react"
import { CodeBlock } from "../components/CodeBlock.tsx"
import { CopyFlash } from "../components/CopyFlash.tsx"
import { DownloadLinks } from "../components/DownloadLinks.tsx"
import { useAssetCopy } from "../components/CopyMenu.tsx"
import { PageHeader } from "../components/PageHeader.tsx"
import {
  LOGO_DONTS,
  LOGO_DOS,
  LOGO_PRESETS,
  logoProps,
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
 * download). The outcome flashes over the logo — orange when it worked, coral when it
 * didn't — and fades as the copy status clears.
 */
function CopyStage({
  exp: { stage, guide, copy },
  frame,
  dark,
  stageClassName = "",
  title,
  hint,
  children,
}: {
  exp: ReturnType<typeof useLogoExport>
  frame?: ExportFrame
  dark?: boolean
  stageClassName?: string
  title: string
  /** A small pill in the corner saying what a click does, for the first logo on the page. */
  hint?: boolean
  children: ReactNode
}) {
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
        {hint ? (
          <span className="copy-hint" aria-hidden="true">
            Click to copy PNG
          </span>
        ) : null}
        <CopyFlash status={copy.status} />
      </button>
      {copy.menu}
    </>
  )
}

// ---- Presets ------------------------------------------------------------------------------

/** Renders one logo file at `size`, the same props its `jsx` spells out. */
function LogoForFile({ file, size }: { file: LogoFile; size: number }) {
  const { layout, title } = file
  const props = { ...logoProps(file.treatment), size, title }
  if (layout === "logomark") return <Logo.Logomark {...props} />
  if (layout === "wordmark") return <Logo.Wordmark size={size} color={props.color} title={title} />
  return <Logo {...props} layout={layout} />
}

/** A preset: the copyable logo, its name, and when to use it. */
function PresetCard({ preset, hint }: { preset: LogoPreset; hint?: boolean }) {
  const { name, when, file, size } = preset
  const exp = useLogoExport({ frame: file.frame, fileName: file.id, usage: file.jsx })
  return (
    <div className="card preset">
      <CopyStage
        exp={exp}
        frame={file.frame}
        dark={file.background === "dark"}
        title={`${file.id}: click to copy the PNG, right-click for the SVG, JSX, or a download`}
        hint={hint}
      >
        <LogoForFile file={file} size={size} />
      </CopyStage>
      <div className="preset-body">
        <h3>{name}</h3>
        <p>{when}</p>
        <DownloadLinks asset={{ type: "logo", slug: file.id }} />
      </div>
    </div>
  )
}

// ---- Guidelines ---------------------------------------------------------------------------

// posthog.com's callout box (its `CalloutBox`): a full tinted border, an icon beside a bold
// title, the body indented under it. The glyphs are copied from @posthog/icons.
const CALLOUT_ICONS = {
  do: [
    "M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17ZM2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm13.475-3.08a.75.75 0 0 1 .106 1.055l-4.5 5.5a.75.75 0 0 1-1.111.055l-2-2a.75.75 0 1 1 1.06-1.06l1.414 1.414 3.975-4.859a.75.75 0 0 1 1.056-.105Z",
  ],
  dont: [
    "M12.216 3.602a.25.25 0 0 0-.432 0L3.28 18.124a.25.25 0 0 0 .216.376h17.01a.25.25 0 0 0 .216-.376L12.216 3.602Zm-1.726-.758a1.75 1.75 0 0 1 3.02 0l8.505 14.522C22.7 18.532 21.857 20 20.505 20H3.495c-1.352 0-2.194-1.468-1.51-2.634L10.49 2.844ZM12 9a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 12 9Z",
    "M13 15.75a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z",
  ],
  info: [
    "M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17ZM2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm8-1a.75.75 0 0 1 .75-.75H12a.75.75 0 0 1 .75.75v5.25a.75.75 0 0 1-1.5 0v-4.5h-.5A.75.75 0 0 1 10 11Z",
    "M13 7.75a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z",
  ],
} as const

interface CalloutProps {
  type: keyof typeof CALLOUT_ICONS
  title: string
  children: ReactNode
}

function Callout({ type, title, children }: CalloutProps) {
  return (
    <div className={`callout callout-${type}`}>
      <div className="callout-title">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          {CALLOUT_ICONS[type].map((d) => (
            <path key={d} fillRule="evenodd" clipRule="evenodd" d={d} />
          ))}
        </svg>
        <strong>{title}</strong>
      </div>
      <div className="callout-body">{children}</div>
    </div>
  )
}

function Guidelines() {
  return (
    <>
      <div className="guidelines">
        <Callout type="do" title="Do">
          <ul>
            {LOGO_DOS.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </Callout>
        <Callout type="dont" title="Don't">
          <ul>
            {LOGO_DONTS.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </Callout>
      </div>
      <Callout type="info" title="Using the logo outside PostHog">
        <ul>
          <li>
            Say your product <em>works with</em>, is <em>built for</em>, or is <em>built on</em>{" "}
            PostHog. Don't call it official or suggest we endorse it. “Desktop Studio for PostHog”
            is fine, “Official PostHog Desktop Studio” is not.
          </li>
          <li>Use the logo as it is, and keep it out of your project's main branding.</li>
          <li>
            Ask us before using the hedgehogs or other illustrations in anything commercial or in
            marketing.
          </li>
          <li>
            Questions? Email <a href="mailto:marketing@posthog.com">marketing@posthog.com</a>.
          </li>
        </ul>
      </Callout>
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
  const title = "PostHog logo builder preview"
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
        title={`${fileName}: click to copy the PNG, right-click for the SVG, JSX, or a download`}
      >
        {preview}
      </CopyStage>
      <p className="builder-note">
        {frame ? (
          <>
            Padded for avatar uploads that crop to a {frame} (G2, X, LinkedIn, Reddit, Slack). The
            dashed line shows the crop. The padding is part of the file, so upload it as it is.
          </>
        ) : (
          <>Cropped tight around the logo. For profile pictures, pick Square or Circle.</>
        )}{" "}
        Saves as <code>{fileName}</code>.
      </p>
      <CodeBlock slug="logo-builder" code={`${IMPORT_LINE}\n\n${jsx}`} />
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
        Which lockup to draw. <code>Logo.Logomark</code> and <code>Logo.Wordmark</code> are
        shortcuts for the last two.
      </>
    ),
  },
  {
    name: "variant",
    type: `"gradient" | "print" | "mono"`,
    def: `"gradient"`,
    note: "Full color, flat 4-color for print, or one color.",
  },
  {
    name: "color",
    type: "string",
    def: "currentColor",
    note: (
      <>
        Any CSS color. Only used by <code>mono</code> and the wordmark.
      </>
    ),
  },
  {
    name: "size",
    type: "number",
    def: "100%",
    note: "Width in px. The height follows the aspect ratio.",
  },
  {
    name: "title",
    type: "string",
    note: "Accessible label. Leave it out and the logo is treated as decoration.",
  },
]

const LOGOMARK_PROPS: typeof PROPS = [
  {
    name: "holiday",
    type: `"christmas" | "halloween"`,
    note: "Adds a seasonal hat. It never changes by date on its own.",
  },
  {
    name: "jumpOnClick",
    type: "boolean",
    def: "false",
    note: "Jumps when clicked. Click faster to jump higher.",
  },
  { name: "autoJumpMs", type: "number", note: "Jumps on its own every N milliseconds." },
  { name: "jumpHeight", type: "number", def: "12", note: "How high it jumps, in viewBox units." },
  { name: "airtimeMs", type: "number", def: "400", note: "How long one jump takes." },
  {
    name: "ref",
    type: "LogomarkHandle",
    note: (
      <>
        Call <code>ref.current.jump(magnitude?)</code> to make it jump from your code.
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
              <td className="nowrap">
                <code>{p.name}</code>
              </td>
              <td>
                <code>{p.type}</code>
              </td>
              <td className="nowrap">{p.def ? <code>{p.def}</code> : "None"}</td>
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
        <Logo.Logomark
          ref={mark}
          size={64}
          title="PostHog logomark that jumps when you press a button"
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="btn btn-primary" onClick={() => mark.current?.jump()}>
            Jump
          </button>
          <button type="button" className="btn" onClick={() => mark.current?.jump(4)}>
            Jump higher
          </button>
        </div>
      </div>
      <CodeBlock slug="logo-imperative-jump" code={IMPERATIVE_CODE} />
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
        Every logo on this page comes from the same <code>&lt;Logo&gt;</code> component. Right-click
        a preset to copy its JSX, or build your own above.
      </p>
      <CodeBlock slug="logo-react" code={REACT_EXAMPLE} />

      <h3 className="props-subhead">Props</h3>
      <PropsTable rows={PROPS} />
      <h3 className="props-subhead">
        <code>Logo.Logomark</code> only
      </h3>
      <PropsTable rows={LOGOMARK_PROPS} />
      <p className="section-lede">
        It also accepts any regular <code>&lt;svg&gt;</code> prop, like <code>className</code>,{" "}
        <code>style</code>, or <code>onClick</code>.
      </p>

      <h3 className="props-subhead">Jump from your own code</h3>
      <p className="section-lede">
        The logomark's <code>ref</code> is a <code>LogomarkHandle</code>. Call <code>jump()</code>{" "}
        on it whenever you like, with an optional magnitude.
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
        The approved PostHog logos and when to use each one. Click a logo to copy it as a PNG, or
        right-click for the SVG, the JSX, or a download.
      </PageHeader>

      <section className="section">
        <h2>Presets</h2>
        <div className="grid grid-presets">
          {LOGO_PRESETS.map((preset, i) => (
            <PresetCard key={preset.file.id} preset={preset} hint={i === 0} />
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
          Pick a layout, a brand color, a square or circle canvas for avatars, or a holiday hat.
          Then export it as a PNG or SVG, or copy the JSX.
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
