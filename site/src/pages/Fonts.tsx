import { roundHog } from "@posthog/brand/fonts"
import type { FontFace } from "@posthog/brand/fonts"
import { CodeBlock } from "../components/CodeBlock.tsx"
import { PageHeader } from "../components/PageHeader.tsx"

// The site already injects RoundHog's @font-face rules (main.tsx), so every specimen
// below is set in the real bundled woff2 — no extra loading here. This page is driven
// entirely by the `roundHog` metadata export, so it stays in sync with the shipped faces.

const WEIGHT_NAMES: Record<number, string> = {
  400: "Regular",
  500: "Medium",
  700: "SemiBold",
  800: "Bold",
}

const PANGRAM = "The quick brown hedgehog jumps over 12 lazy foxes."

const CSS_USAGE = `import { roundHogFontFaceCss } from "@posthog/brand/fonts/css"

const style = document.createElement("style")
style.textContent = roundHogFontFaceCss
document.head.appendChild(style)
// then, anywhere: font-family: "RoundHog", sans-serif;`

const META_USAGE = `import { roundHog } from "@posthog/brand/fonts"

// Build your own @font-face / <link rel="preload"> from the metadata:
roundHog.family              // "RoundHog"
roundHog.faces.map((f) => f.url)  // the bundled woff2 URLs`

function faceLabel(face: FontFace): string {
  const weight = `${WEIGHT_NAMES[face.weight] ?? face.weight} ${face.weight}`
  return face.style === "italic" ? `${weight} · Italic` : weight
}

export function FontsPage() {
  return (
    <div>
      <PageHeader eyebrow="@posthog/brand/fonts" title="RoundHog">
        PostHog's brand typeface, bundled offline as eight <code>woff2</code> faces (Regular&nbsp;·
        Medium&nbsp;· SemiBold&nbsp;· Bold, each upright and italic). This entire site is set in
        RoundHog — the <code>@font-face</code> rules come straight from{" "}
        <code>@posthog/brand/fonts/css</code>. No CDN, no loader config.
      </PageHeader>

      <section className="section">
        <h2>Specimen</h2>
        <div className="card font-specimen">
          <p className="font-specimen-big" style={{ fontWeight: 800 }}>
            RoundHog
          </p>
          <p className="font-specimen-scale" style={{ fontWeight: 400 }}>
            ABCDEFGHIJKLMNOPQRSTUVWXYZ
            <br />
            abcdefghijklmnopqrstuvwxyz
            <br />
            0123456789 &amp; ! ? @ # % — “”
          </p>
        </div>
      </section>

      <section className="section">
        <h2>Faces</h2>
        <div className="grid grid-cards">
          {roundHog.faces.map((face) => (
            <div className="card face-card" key={`${face.weight}-${face.style}`}>
              <div className="face-meta">
                <span className="face-name">{faceLabel(face)}</span>
                <code className="face-token">
                  font-weight: {face.weight}; font-style: {face.style};
                </code>
              </div>
              <p className="face-sample" style={{ fontWeight: face.weight, fontStyle: face.style }}>
                {PANGRAM}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Use it</h2>
        <p>
          Drop the ready-made <code>@font-face</code> string into a <code>&lt;style&gt;</code> — the
          bundled woff2 URLs are already baked in:
        </p>
        <CodeBlock code={CSS_USAGE} />
        <p style={{ marginTop: 24 }}>
          Or build your own <code>@font-face</code> / preload from the face metadata:
        </p>
        <CodeBlock code={META_USAGE} />
      </section>
    </div>
  )
}
