import { Logo } from "@posthog/brand/logo"
import type { LogoLayout, LogomarkHandle, LogoVariant } from "@posthog/brand/logo"
import type { ReactNode } from "react"
import { useLayoutEffect, useRef, useState } from "react"
import { CopyButton } from "../components/CopyButton.tsx"
import { useAssetCopy } from "../components/CopyMenu.tsx"
import { PageHeader } from "../components/PageHeader.tsx"
import { frameSide, standaloneSvg, svgToPng, type ExportFrame } from "../svg-export.ts"
import { useSeo } from "../useSeo.ts"

const IMPORT_LINE = `import { Logo } from "@posthog/brand/logo"`

interface CellProps {
  code: string
  dark?: boolean
  /** Export on a padded square/circle-safe canvas; a dashed guide previews the crop. */
  frame?: ExportFrame
  children: ReactNode
}

/**
 * A static logo, copyable like the catalog tiles: click copies a PNG, right-click offers the
 * import line, this cell's JSX, the SVG, or the PNG. The package ships the logo only as a
 * component, so the SVG/PNG are snapshotted from what it rendered here (see svg-export.ts).
 *
 * With a `frame`, the snapshot grows to the padded canvas (see svg-export.ts) and the stage
 * draws a dashed guide of the exact crop. No JSX is offered — no `<Logo>` props reproduce
 * the padding; the point of these cells is the file.
 */
function LogoCell({ code, dark, frame, children }: CellProps) {
  const stage = useRef<HTMLDivElement>(null)
  // The guide applies the export math to the rendered mark, so it never drifts from it.
  const [guide, setGuide] = useState<number>()
  useLayoutEffect(() => {
    if (!frame) return
    const svg = stage.current?.querySelector("svg")
    if (!svg) return
    const { width, height } = svg.getBoundingClientRect()
    setGuide(frameSide(width, height, frame))
  }, [frame])
  const snapshot = () => {
    const svg = stage.current?.querySelector("svg")
    if (!svg) throw new Error("No logo rendered")
    return standaloneSvg(svg, frame)
  }
  // `<Logo layout="stacked" variant="mono" … />` → `posthog-logo-layout-stacked-variant-mono-…`;
  // avatar cells' codes are already the file name, so they don't get the prefix again.
  const slug = code
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  const copy = useAssetCopy({
    importLine: IMPORT_LINE,
    usage: frame ? undefined : code,
    fileName: slug.startsWith("posthog") ? slug : `posthog-${slug}`,
    svg: async () => snapshot().markup,
    png: async () => {
      const { markup, width, height } = snapshot()
      return svgToPng(markup, width, height)
    },
  })
  const status = copy.status

  return (
    <>
      <button
        type="button"
        className={`card logo-cell${status ? (status.ok ? " copied" : " copy-failed") : ""}`}
        onClick={copy.onClick}
        onContextMenu={copy.onContextMenu}
        title={
          frame
            ? "Click to copy the padded PNG; right-click to download it or copy the SVG"
            : "Click to copy the PNG; right-click for the JSX, import line, or SVG"
        }
      >
        <span ref={stage} className={`logo-stage${dark ? " dark" : ""}`}>
          {frame ? (
            <span
              className={`frame-guide${frame === "circle" ? " circle" : ""}`}
              style={guide ? { width: guide, height: guide } : undefined}
            >
              {children}
            </span>
          ) : (
            children
          )}
        </span>
        <span className="logo-label" aria-live="polite">
          {status ? status.label : <code>{code}</code>}
        </span>
      </button>
      {copy.menu}
    </>
  )
}

/** An interactive (jumping) logo: clicks belong to the mark, so the code gets a Copy button. */
function JumpCell({ code, dark, children }: CellProps) {
  return (
    <div className="card logo-cell">
      <div className={`logo-stage${dark ? " dark" : ""}`}>{children}</div>
      <div className="logo-label" style={{ display: "flex", justifyContent: "space-between" }}>
        <code>{code}</code>
        <CopyButton value={code} />
      </div>
    </div>
  )
}

/**
 * Demo of the imperative handle: hold a `ref`, then jump the mark from anywhere — here, two
 * buttons outside the mark. No `jumpOnClick` / `autoJumpMs`; the buttons call `ref.current.jump()`.
 */
function ImperativeJumpCell() {
  const mark = useRef<LogomarkHandle>(null)
  return (
    <div className="card logo-cell">
      <div className="logo-stage" style={{ flexDirection: "column", gap: 16 }}>
        <Logo.Logomark ref={mark} size={72} title="PostHog logomark — jump from a button" />
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="btn btn-primary" onClick={() => mark.current?.jump()}>
            Jump
          </button>
          <button type="button" className="btn" onClick={() => mark.current?.jump(4)}>
            Jump higher
          </button>
        </div>
      </div>
      <div className="logo-label" style={{ display: "flex", justifyContent: "space-between" }}>
        <code>mark.current?.jump()</code>
        <CopyButton
          value={`const mark = useRef<LogomarkHandle>(null)\n<Logo.Logomark ref={mark} />\n<button onClick={() => mark.current?.jump()}>Jump</button>`}
        />
      </div>
    </div>
  )
}

const LOCKUPS: { layout: LogoLayout; label: string; size: number }[] = [
  { layout: "landscape", label: "Landscape", size: 180 },
  { layout: "stacked", label: "Stacked", size: 110 },
  { layout: "logomark", label: "Logomark", size: 72 },
]

/** The color treatments shown per lockup; mono comes in white (on dark) and black (on light). */
interface Treatment {
  variant: LogoVariant
  color?: string
  dark?: boolean
}

const TREATMENTS: Treatment[] = [
  { variant: "gradient" },
  { variant: "print" },
  { variant: "mono", color: "#fff", dark: true },
  { variant: "mono", color: "#111" },
]

function lockupCode(layout: LogoLayout, treatment: Treatment): string {
  const props: string[] = []
  if (layout !== "landscape") props.push(`layout="${layout}"`)
  if (treatment.variant !== "gradient") props.push(`variant="${treatment.variant}"`)
  if (treatment.color) props.push(`color="${treatment.color}"`)
  return props.length ? `<Logo ${props.join(" ")} />` : `<Logo />`
}

/** The avatar exports: logomark and stacked lockup on square and circle-safe canvases. */
const AVATARS: {
  code: string
  frame: ExportFrame
  layout: "logomark" | "stacked"
  white?: boolean
}[] = [
  { code: "posthog-logomark-square", frame: "square", layout: "logomark" },
  { code: "posthog-logomark-square-white", frame: "square", layout: "logomark", white: true },
  { code: "posthog-logo-stacked-square", frame: "square", layout: "stacked" },
  { code: "posthog-logo-stacked-square-white", frame: "square", layout: "stacked", white: true },
  { code: "posthog-logomark-circle", frame: "circle", layout: "logomark" },
  { code: "posthog-logomark-circle-white", frame: "circle", layout: "logomark", white: true },
  { code: "posthog-logo-stacked-circle", frame: "circle", layout: "stacked" },
  { code: "posthog-logo-stacked-circle-white", frame: "circle", layout: "stacked", white: true },
]

export function LogoPage() {
  useSeo("/logo")

  return (
    <div>
      <PageHeader eyebrow="@posthog/brand/logo" title="Logo">
        One parametric <code>&lt;Logo&gt;</code> covers every lockup and color treatment. Pick a{" "}
        <code>layout</code> (<code>landscape</code> · <code>stacked</code> · <code>logomark</code> ·{" "}
        <code>wordmark</code>) and a <code>variant</code> (<code>gradient</code> ·{" "}
        <code>print</code> · <code>mono</code>). <code>mono</code> takes any <code>color</code> and
        otherwise inherits <code>currentColor</code>.
      </PageHeader>

      {LOCKUPS.map((lockup) => (
        <section className="section" key={lockup.layout}>
          <h2>{lockup.label}</h2>
          <div className="grid grid-cards">
            {TREATMENTS.map((treatment) => (
              <LogoCell
                key={treatment.variant + (treatment.color ?? "")}
                code={lockupCode(lockup.layout, treatment)}
                dark={treatment.dark}
              >
                <Logo
                  layout={lockup.layout}
                  variant={treatment.variant}
                  color={treatment.color}
                  size={lockup.size}
                  title={`PostHog logo — ${lockup.label}, ${treatment.variant}${
                    treatment.color ? ` ${treatment.color}` : ""
                  }`}
                />
              </LogoCell>
            ))}
          </div>
        </section>
      ))}

      <section className="section">
        <h2>Avatars — square &amp; circle-safe</h2>
        <p>
          Padded, transparent exports for profile pictures and integration icons — G2, X, LinkedIn,
          Reddit — where the host crops to a square or a circle and gives you no control over the
          margin. The padding is baked into the file and the dashed guide shows the exact crop, so
          upload the file as-is: nothing gets clipped, and the mark keeps its proportions.
        </p>
        <div className="grid grid-cards">
          {AVATARS.map((avatar) => (
            <LogoCell key={avatar.code} code={avatar.code} frame={avatar.frame} dark={avatar.white}>
              <Logo
                layout={avatar.layout}
                variant={avatar.white ? "mono" : "gradient"}
                color={avatar.white ? "#fff" : undefined}
                size={avatar.layout === "stacked" ? 90 : 64}
                title={`PostHog ${avatar.layout === "stacked" ? "stacked logo" : "logomark"} — ${
                  avatar.frame
                }-safe avatar${avatar.white ? ", white" : ""}`}
              />
            </LogoCell>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Holidays</h2>
        <p>
          Dress the logomark up for a festive season with the <code>holiday</code> prop. Nothing
          switches by date — render the one you want, when you want it. It composes with{" "}
          <code>jumpOnClick</code>, so the hat jumps too (see Jumping, below).
        </p>
        <div className="grid grid-cards">
          <LogoCell code={`<Logo.Logomark holiday="christmas" />`}>
            <Logo.Logomark size={72} holiday="christmas" title="PostHog logomark — Christmas" />
          </LogoCell>
          <LogoCell code={`<Logo.Logomark holiday="halloween" />`}>
            <Logo.Logomark size={72} holiday="halloween" title="PostHog logomark — Halloween" />
          </LogoCell>
        </div>
      </section>

      <section className="section">
        <h2>Wordmark</h2>
        <div className="grid grid-cards">
          <LogoCell code={`<Logo.Wordmark />`}>
            <Logo.Wordmark size={150} title="PostHog wordmark" />
          </LogoCell>
          <LogoCell code={`<Logo.Wordmark color="#FF5C1C" />`}>
            <Logo.Wordmark size={150} color="#FF5C1C" title="PostHog wordmark, tangerine" />
          </LogoCell>
          <LogoCell code={`<Logo.Wordmark color="#fff" />`} dark>
            <Logo.Wordmark size={150} color="#fff" title="PostHog wordmark, white" />
          </LogoCell>
        </div>
      </section>
      <section className="section">
        <h2>Jumping</h2>
        <p>
          The logomark can jump — the same <code>Logo.Logomark</code>, opted in with{" "}
          <code>jumpOnClick</code> (each rapid click jumps higher) or <code>autoJumpMs</code>. Or
          drive it yourself: its <code>ref</code> is a <code>LogomarkHandle</code>, so{" "}
          <code>ref.current.jump()</code> jumps it from anywhere — pass a magnitude to jump higher.
        </p>
        <div className="grid grid-cards">
          <JumpCell code={`<Logo.Logomark jumpOnClick />`}>
            <Logo.Logomark size={72} jumpOnClick title="PostHog logomark — click to jump" />
          </JumpCell>
          <JumpCell code={`<Logo.Logomark autoJumpMs={3000} />`}>
            <Logo.Logomark size={72} autoJumpMs={3000} title="PostHog logomark — auto-jumping" />
          </JumpCell>
          <ImperativeJumpCell />
          <JumpCell code={`<Logo.Logomark holiday="christmas" jumpOnClick />`}>
            <Logo.Logomark
              size={72}
              holiday="christmas"
              jumpOnClick
              title="PostHog logomark — Christmas, click to jump"
            />
          </JumpCell>
          <JumpCell code={`<Logo.Logomark jumpOnClick variant="mono" color="#fff" />`} dark>
            <Logo.Logomark
              size={72}
              jumpOnClick
              variant="mono"
              color="#fff"
              title="PostHog logomark — mono, click to jump"
            />
          </JumpCell>
        </div>
      </section>
    </div>
  )
}
