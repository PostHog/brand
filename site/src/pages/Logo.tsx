import { Logo } from "@posthog/brand/logo"
import type { LogoLayout, LogoVariant } from "@posthog/brand/logo"
import type { ReactNode } from "react"
import { CopyButton } from "../components/CopyButton.tsx"
import { PageHeader } from "../components/PageHeader.tsx"

interface CellProps {
  code: string
  dark?: boolean
  children: ReactNode
}

function LogoCell({ code, dark, children }: CellProps) {
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
        <h2>Jumping</h2>
        <p>
          The logomark can jump — the same <code>Logo.Logomark</code>, opted in with{" "}
          <code>jumpOnClick</code> (each rapid click jumps higher) or <code>autoJumpMs</code>.
        </p>
        <div className="grid grid-cards">
          <LogoCell code={`<Logo.Logomark jumpOnClick />`}>
            <Logo.Logomark size={72} jumpOnClick title="PostHog logomark — click to jump" />
          </LogoCell>
          <LogoCell code={`<Logo.Logomark autoJumpMs={3000} />`}>
            <Logo.Logomark size={72} autoJumpMs={3000} title="PostHog logomark — auto-jumping" />
          </LogoCell>
          <LogoCell code={`<Logo.Logomark jumpOnClick variant="mono" color="#fff" />`} dark>
            <Logo.Logomark
              size={72}
              jumpOnClick
              variant="mono"
              color="#fff"
              title="PostHog logomark — mono, click to jump"
            />
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
    </div>
  )
}
