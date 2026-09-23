import { Logo } from "@posthog/brand/logo"
import type { LogoLayout, LogomarkHandle, LogoVariant } from "@posthog/brand/logo"
import type { ReactNode } from "react"
import { useRef } from "react"
import { CopyButton } from "../components/CopyButton.tsx"
import { useAssetCopy } from "../components/CopyMenu.tsx"
import { PageHeader } from "../components/PageHeader.tsx"
import { standaloneSvg, svgToPng } from "../svg-export.ts"
import { useSeo } from "../useSeo.ts"

const IMPORT_LINE = `import { Logo } from "@posthog/brand/logo"`

interface CellProps {
  code: string
  dark?: boolean
  children: ReactNode
}

/**
 * A static logo, copyable like the catalog tiles: click copies a PNG, right-click offers the
 * import line, this cell's JSX, the SVG, or the PNG. The package ships the logo only as a
 * component, so the SVG/PNG are snapshotted from what it rendered here (see svg-export.ts).
 */
function LogoCell({ code, dark, children }: CellProps) {
  const stage = useRef<HTMLDivElement>(null)
  const snapshot = () => {
    const svg = stage.current?.querySelector("svg")
    if (!svg) throw new Error("No logo rendered")
    return standaloneSvg(svg)
  }
  const copy = useAssetCopy({
    importLine: IMPORT_LINE,
    usage: code,
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
        title="Click to copy the PNG; right-click for the JSX, import line, or SVG"
      >
        <span ref={stage} className={`logo-stage${dark ? " dark" : ""}`}>
          {children}
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

const VARIANTS: LogoVariant[] = ["gradient", "print", "mono"]

function lockupCode(layout: LogoLayout, variant: LogoVariant): string {
  const props: string[] = []
  if (layout !== "landscape") props.push(`layout="${layout}"`)
  if (variant !== "gradient") props.push(`variant="${variant}"`)
  if (variant === "mono") props.push(`color="#fff"`)
  return props.length ? `<Logo ${props.join(" ")} />` : `<Logo />`
}

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
            {VARIANTS.map((variant) => {
              const mono = variant === "mono"
              return (
                <LogoCell key={variant} code={lockupCode(lockup.layout, variant)} dark={mono}>
                  <Logo
                    layout={lockup.layout}
                    variant={variant}
                    color={mono ? "#fff" : undefined}
                    size={lockup.size}
                    title={`PostHog logo — ${lockup.label}, ${variant}`}
                  />
                </LogoCell>
              )
            })}
          </div>
        </section>
      ))}

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
