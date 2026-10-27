import { roundHog } from "@posthog/brand/fonts"
import type { FontFace } from "@posthog/brand/fonts"
import { CodeBlock } from "../components/CodeBlock.tsx"
import { PageHeader } from "../components/PageHeader.tsx"
import { useSeo } from "../useSeo.ts"

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
// Then use it anywhere: font-family: "RoundHog", sans-serif;`

const META_USAGE = `import { roundHog } from "@posthog/brand/fonts"

roundHog.family                    // "RoundHog"
roundHog.faces[0].subsets          // [{ name: "latin", url, unicodeRange }, …]
roundHog.faces[0].url              // the full face, for downloads and design tools

// One @font-face per subset, each with its unicodeRange. Leave the full face out:
// its range covers everything, so a page with any non-Latin character loads it too.`

const PRELOAD_USAGE = `import { roundHogFaces } from "@posthog/brand/fonts"

// Preload the Latin subset of the faces your first screen shows.
const regular = roundHogFaces.find((f) => f.weight === 400 && f.style === "normal")
const href = regular?.subsets.find((s) => s.name === "latin")?.url

<link rel="preload" as="font" type="font/woff2" crossOrigin="" href={href} />`

// What each subset holds, in the order the package lists them.
const SUBSETS: ReadonlyArray<{ name: string; holds: string }> = [
  {
    name: "latin",
    holds:
      "English and Western European letters, accents, punctuation, €, and the arrows, math, keyboard (⌘ ⌥), box drawing and dingbat symbols the PostHog UI uses. Almost every page needs only this.",
  },
  {
    name: "latin-ext",
    holds:
      "Central and Eastern European Latin (ą, ő, ž), Vietnamese, phonetic letters and other currency signs.",
  },
  { name: "greek", holds: "Greek, including polytonic." },
  { name: "cyrillic", holds: "Cyrillic." },
  { name: "rest", holds: "Superscripts, fractions, letterlike symbols and private-use glyphs." },
]

function faceLabel(face: FontFace): string {
  const weight = `${WEIGHT_NAMES[face.weight] ?? face.weight} ${face.weight}`
  return face.style === "italic" ? `${weight} · Italic` : weight
}

export function FontsPage() {
  useSeo("/fonts")

  return (
    <div>
      <PageHeader eyebrow="@posthog/brand/fonts" title="RoundHog">
        PostHog's typeface. The package includes eight <code>woff2</code> faces: Regular, Medium,
        SemiBold, and Bold, each upright and italic. This site is set in RoundHog, loaded from{" "}
        <code>@posthog/brand/fonts/css</code>.
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
        <h2>Subsets</h2>
        <p>
          A full face is about 120 KB, and most of that is scripts a page rarely shows. So each face
          is also cut into five subsets by script, each with a <code>unicode-range</code>. The
          ranges don't overlap, so the browser downloads a subset only when the page shows one of
          its characters, and never the full face. Latin text loads about 50 KB per face. A Cyrillic
          or Greek name adds 10–15 KB.
        </p>
        <div className="card props-table">
          <table>
            <thead>
              <tr>
                <th>Subset</th>
                <th>Holds</th>
              </tr>
            </thead>
            <tbody>
              {SUBSETS.map(({ name, holds }) => (
                <tr key={name}>
                  <td className="nowrap">
                    <code>{name}</code>
                  </td>
                  <td>{holds}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section">
        <h2>Use it</h2>
        <p>
          Add the <code>@font-face</code> rules to a <code>&lt;style&gt;</code> tag. They register
          every subset of every face, already pointing at the bundled woff2 files.
        </p>
        <CodeBlock slug="fonts-css" code={CSS_USAGE} />
        <p style={{ marginTop: 24 }}>
          Or write your own <code>@font-face</code> rules from the metadata. Register the subsets,
          not the full face.
        </p>
        <CodeBlock slug="fonts-metadata" code={META_USAGE} />
        <p style={{ marginTop: 24 }}>
          To preload, preload the <code>latin</code> subset. Preloading the full face downloads
          bytes the page never uses.
        </p>
        <CodeBlock slug="fonts-preload" code={PRELOAD_USAGE} />
      </section>
    </div>
  )
}
