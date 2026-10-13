import type { BrandColor } from "@posthog/brand"
import { useRef, useState } from "react"
import { track } from "../analytics.ts"
import { copyToClipboard } from "../clipboard.ts"

interface SwatchProps {
  /** Palette key, e.g. "corn-blue". */
  slug: string
  tone: string
  hex: string
}

function Swatch({ slug, tone, hex }: SwatchProps) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  function onClick() {
    void copyToClipboard(hex).then((ok) => {
      track("color copied", { color: slug, tone, hex, success: ok })
      if (!ok) return
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 1200)
    })
  }

  return (
    <button type="button" className="swatch" onClick={onClick} title={`Copy ${hex}`}>
      <span className="swatch-chip" style={{ background: hex }} />
      <span className="swatch-meta">
        <span className="swatch-tone">{tone}</span>
        <span className="swatch-hex">{copied ? "Copied!" : hex}</span>
      </span>
    </button>
  )
}

interface ColorCardProps {
  /** The palette key, e.g. "corn-blue" — also the CSS var stem (`--posthog-corn-blue`). */
  slug: string
  color: BrandColor
}

/** One brand color: a gradient header, its CSS var name, and click-to-copy tonal swatches. */
export function ColorCard({ slug, color }: ColorCardProps) {
  const [from, to] = color.gradient
  return (
    <div className="card color-card">
      <div
        className="color-gradient"
        style={{ background: `linear-gradient(180deg, ${from} 0%, ${to} 100%)` }}
      />
      <div className="color-body">
        <p className="color-name">{color.name}</p>
        <div className="swatch-row">
          <Swatch slug={slug} tone="core" hex={color.core} />
          <Swatch slug={slug} tone="lighter" hex={color.lighter} />
          <Swatch slug={slug} tone="darker" hex={color.darker} />
        </div>
        <p className="swatch-tone" style={{ marginTop: 12 }}>
          CSS: <code>var(--posthog-{slug})</code>
        </p>
      </div>
    </div>
  )
}
