// The logo as a set of named, downloadable files — one table shared by the Logo page (its
// presets render from it) and the build (`agent/`), which writes each one to `/logo/<id>.svg`
// and `/logo/<id>.png` and lists them in the markdown, llms.txt and catalog.json. Keeping both
// on this table is what makes "the white stacked logo" mean the same file everywhere.
//
// The package ships the logo only as the parametric <Logo> component, so a file here is just a
// point in its prop space (layout × color treatment × canvas) plus a stable name.

import type { LogoLayout, LogoVariant } from "@posthog/brand/logo"
import type { ExportFrame } from "./svg-export.ts"

/**
 * Color treatment of a logo file. `black` and `white` are `variant="mono"` with that color;
 * the wordmark has no gradient or print artwork, so it only comes in those two.
 */
export type LogoTreatment = "gradient" | "print" | "black" | "white"

const LOGO_BLACK = "#000"
const LOGO_WHITE = "#fff"

export interface LogoFile {
  /** File stem and stable id, e.g. "posthog-logo-stacked-white" → /logo/<id>.svg. */
  id: string
  /** Human label, also the rendered logo's accessible title. */
  title: string
  layout: LogoLayout
  treatment: LogoTreatment
  /** Padded avatar canvas (see svg-export.ts); absent for the tight lockup. */
  frame?: ExportFrame
  /** The background it is made for: the white logos go on dark ones. */
  background: "light" | "dark"
  /** The JSX that renders it. Absent for padded avatars, whose padding is export-only. */
  jsx?: string
}

const LAYOUT_STEM: Record<LogoLayout, string> = {
  landscape: "posthog-logo",
  stacked: "posthog-logo-stacked",
  logomark: "posthog-logomark",
  wordmark: "posthog-wordmark",
}

const LAYOUT_TITLE: Record<LogoLayout, string> = {
  landscape: "PostHog logo",
  stacked: "PostHog stacked logo",
  logomark: "PostHog logomark",
  wordmark: "PostHog wordmark",
}

const TREATMENT_TITLE: Record<LogoTreatment, string> = {
  gradient: "",
  print: ", 4-color print",
  black: ", black",
  white: ", white",
}

const FRAME_TITLE: Record<ExportFrame, string> = {
  square: ", square avatar",
  circle: ", round avatar",
}

/**
 * The `<Logo>` props a treatment means — the one mapping the rendered presets, the published
 * JSX and the static files (agent/logo-render.ts) all derive from. `color` is set only for
 * black/white, which are `variant="mono"`.
 */
export function logoProps(treatment: LogoTreatment): { variant: LogoVariant; color?: string } {
  if (treatment === "black") return { variant: "mono", color: LOGO_BLACK }
  if (treatment === "white") return { variant: "mono", color: LOGO_WHITE }
  return { variant: treatment }
}

/** `<Logo …/>` for a layout + treatment, in the order the Logo page's builder writes props. */
function logoJsx(layout: LogoLayout, treatment: LogoTreatment): string {
  const tag =
    layout === "logomark" ? "Logo.Logomark" : layout === "wordmark" ? "Logo.Wordmark" : "Logo"
  const { variant, color } = logoProps(treatment)
  const props: string[] = []
  if (layout === "stacked") props.push(`layout="stacked"`)
  // The wordmark has no `variant`: it's always mono.
  if (layout !== "wordmark" && variant !== "gradient") props.push(`variant="${variant}"`)
  if (color) props.push(`color="${color}"`)
  return `<${[tag, ...props].join(" ")} />`
}

function logoFile(layout: LogoLayout, treatment: LogoTreatment, frame?: ExportFrame): LogoFile {
  const suffix = treatment === "gradient" ? "" : `-${treatment}`
  return {
    id: `${LAYOUT_STEM[layout]}${frame ? `-${frame}` : ""}${suffix}`,
    title: `${LAYOUT_TITLE[layout]}${TREATMENT_TITLE[treatment]}${frame ? FRAME_TITLE[frame] : ""}`,
    layout,
    treatment,
    frame,
    background: treatment === "white" ? "dark" : "light",
    jsx: frame ? undefined : logoJsx(layout, treatment),
  }
}

const ALL_TREATMENTS: LogoTreatment[] = ["gradient", "print", "black", "white"]

/**
 * Every published logo file: each lockup in each treatment, the wordmark in black and white,
 * and the logomark on padded square and circle avatar canvases.
 */
export const LOGO_FILES: readonly LogoFile[] = [
  ...(["landscape", "stacked", "logomark"] as const).flatMap((layout) =>
    ALL_TREATMENTS.map((treatment) => logoFile(layout, treatment)),
  ),
  logoFile("wordmark", "black"),
  logoFile("wordmark", "white"),
  ...(["square", "circle"] as const).flatMap((frame) =>
    ALL_TREATMENTS.map((treatment) => logoFile("logomark", treatment, frame)),
  ),
]

/** One of the handbook's approved logo versions, pointing at its file. */
export interface LogoPreset {
  name: string
  /** When to use it, from the handbook (posthog.com/handbook/brand/assets). */
  when: string
  file: LogoFile
  /** Rendered size on the Logo page. */
  size: number
}

function preset(name: string, when: string, id: string, size: number): LogoPreset {
  const file = LOGO_FILES.find((f) => f.id === id)
  if (!file) throw new Error(`No logo file "${id}"`)
  return { name, when, file, size }
}

export const LOGO_PRESETS: readonly LogoPreset[] = [
  preset("Standard logo", "The primary, full-color logo. Use it by default.", "posthog-logo", 180),
  preset(
    "Light logo",
    "For dark backgrounds. The standard logo should never go on one.",
    "posthog-logo-white",
    180,
  ),
  preset(
    "Dark logo",
    "For light backgrounds, when you need a single-color logo.",
    "posthog-logo-black",
    180,
  ),
  preset(
    "Print (4-color)",
    "For print and limited palettes that can't reproduce gradients.",
    "posthog-logo-print",
    180,
  ),
  preset(
    "Stacked logo",
    "For tall or square spaces where the landscape logo is too wide.",
    "posthog-logo-stacked",
    92,
  ),
  preset(
    "Light stacked logo",
    "The stacked logo for dark backgrounds.",
    "posthog-logo-stacked-white",
    92,
  ),
  preset(
    "Logomark",
    "Use it alone only at small sizes, like favicons and app icons.",
    "posthog-logomark",
    68,
  ),
  preset("Light logomark", "The logomark for dark backgrounds.", "posthog-logomark-white", 68),
  preset(
    "Square logomark",
    "For avatars and integrations that crop to a square (G2, X, LinkedIn). The padding keeps it from getting clipped.",
    "posthog-logomark-square",
    52,
  ),
  preset(
    "Light square logomark",
    "The square logomark for dark backgrounds.",
    "posthog-logomark-square-white",
    52,
  ),
  preset(
    "Round logomark",
    "For avatars that crop to a circle (Reddit, Slack). It fits inside the circle with room to spare.",
    "posthog-logomark-circle",
    52,
  ),
  preset(
    "Light round logomark",
    "The round logomark for dark backgrounds.",
    "posthog-logomark-circle-white",
    52,
  ),
]

/** The handbook's approved versions among `logos` (anything with a logo file `id`), in its order. */
export function inPresetOrder<T extends { id: string }>(logos: readonly T[]): T[] {
  return LOGO_PRESETS.flatMap((preset) => logos.filter((logo) => logo.id === preset.file.id))
}

export const LOGO_DOS: readonly string[] = [
  "Use the standard logo by default.",
  "Use a light (white) logo on dark backgrounds.",
  "Use the square or round logomark for avatars and integrations.",
  "Send vendors the SVG. It scales without losing quality.",
]

export const LOGO_DONTS: readonly string[] = [
  "Put the standard logo on a dark background.",
  "Recolor parts of the logomark, like turning the hedgehog's face white on dark. Use the light logo instead.",
  "Use the logomark on its own, except at small sizes.",
  "Stretch the logomark to fill a square. Use the square logomark instead.",
  "Set “PostHog” in regular text next to the logomark. Use a lockup.",
  "Keep using old local files (the square font, the sharp-edged logomark). Replace them with these.",
]
