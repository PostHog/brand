// Everything the site publishes for agents, as one in-memory model:
//
//   • `catalog` — every logo file, hoggie, crest, color and font face, with absolute URLs to
//     its static files and the package import that renders it. Served as `/catalog.json`, and
//     the input to all the markdown (see markdown.ts) and to the WebMCP tools.
//   • `files` — site path → how to produce that file: each asset's SVG and PNG, the logo
//     renders, the woff2 faces, and the color tokens.
//
// Sources are read straight out of `@posthog/brand`'s built `dist/` — the same modules npm
// consumers import — so a downloaded `/hoggies/chart.svg` is byte-for-byte the package's
// `@posthog/brand/hoggies/svg/chart`. Built once per process (`loadAgentData` is memoized) and
// shared by the build (agent-plugin.ts, seo-plugin.ts) and the dev server.

import { findAssets, getComponentName, type AssetMeta, type CrestTier } from "@posthog/brand"
import { colors } from "@posthog/brand/colors"
import { colorsCss } from "@posthog/brand/colors/css"
import { roundHog } from "@posthog/brand/fonts"
import { fontFaceCss } from "@posthog/brand/fonts/css"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { basename, dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import {
  absoluteUrl,
  crestFilePath,
  crestPagePath,
  hoggieFilePath,
  hoggiePagePath,
  hoggieStem,
  logoFilePath,
  markdownPath,
} from "../src/agent-paths.ts"
import { LOGO_FILES, LOGO_PRESETS, type LogoFile } from "../src/logo-files.ts"
import { PAGES, SITE_NAME, SITE_URL } from "../src/seo.ts"
import { logoPng, logoPngSize, logoSvg } from "./logo-render.ts"

// ---- Catalog shape (public: this is /catalog.json) ----------------------------------------

/** One downloadable rendering of an asset. */
export interface CatalogImage {
  /** Variant family member key (hoggies), e.g. "2". */
  variant?: string
  /** Crest tier. */
  tier?: CrestTier
  /** Absolute URLs of the static files. */
  svg: string
  png: string
  /** Pixel size of the PNG. The SVG scales freely. */
  width: number
  height: number
  /** JSX rendering exactly this image, with the component from `import`. */
  jsx: string
  /** Package subpaths whose default export is the SVG markup string / the PNG URL. */
  svgModule: string
  pngModule: string
}

export interface CatalogAsset {
  type: "hoggie" | "crest"
  slug: string
  name: string
  tags: string[]
  /** Absolute URLs of the HTML page and its markdown twin. */
  page: string
  markdown: string
  /** React component name, and the import line that brings it in. */
  component: string
  import: string
  images: CatalogImage[]
}

export interface CatalogLogo {
  id: string
  title: string
  layout: LogoFile["layout"]
  treatment: LogoFile["treatment"]
  frame?: LogoFile["frame"]
  /** The background it is made for: the white logos are for dark backgrounds. */
  background: "light" | "dark"
  svg: string
  png: string
  width: number
  height: number
  /** JSX that renders it with `import { Logo } from "@posthog/brand/logo"` (not for avatars). */
  jsx?: string
  /** Set when this file is one of the handbook's approved presets. */
  preset?: { name: string; when: string }
}

export interface CatalogColor {
  slug: string
  name: string
  core: string
  lighter: string
  darker: string
  gradient: [string, string]
  /** The CSS custom properties `/colors.css` (and `@posthog/brand/colors/css`) define. */
  cssVariables: { core: string; lighter: string; darker: string; gradient: string }
}

export interface CatalogFontFace {
  weight: number
  style: string
  woff2: string
}

export interface Catalog {
  name: string
  description: string
  site: string
  /** Agent-facing docs: llms.txt, llms-full.txt, and the markdown home page. */
  docs: { llms: string; llmsFull: string; markdown: string }
  package: {
    name: string
    version: string
    install: string
    npm: string
    repository: string
  }
  license: { summary: string; url: string }
  logos: CatalogLogo[]
  hoggies: CatalogAsset[]
  crests: CatalogAsset[]
  colors: CatalogColor[]
  fonts: { family: string; css: string; faces: CatalogFontFace[] }
}

// ---- Static files -------------------------------------------------------------------------

export interface AgentFile {
  contentType: string
  read: () => Promise<Buffer | string> | Buffer | string
}

export interface AgentData {
  catalog: Catalog
  /** Site path (e.g. `/hoggies/chart.svg`) → file. */
  files: Map<string, AgentFile>
}

const SVG = "image/svg+xml"
const PNG = "image/png"

export const LICENSE_URL = "https://github.com/PostHog/brand/blob/main/LICENSE"
export const LICENSE_SUMMARY =
  "PostHog's brand assets are PostHog trademarks, made available under the PolyForm Strict License 1.0.0 (source-available, not open source: commercial use, use in your own projects, distribution and derivative works are not licensed). For licensing inquiries, contact hey@posthog.com."

const require = createRequire(import.meta.url)
const PACKAGE_ROOT = dirname(require.resolve("@posthog/brand/package.json"))
const PACKAGE_VERSION: string = JSON.parse(
  readFileSync(join(PACKAGE_ROOT, "package.json"), "utf8"),
).version

/** A built leaf module of the package, e.g. `dist/generated/hoggies/svg/chart.mjs`. */
async function leaf<T>(group: string, kind: "svg" | "png", slug: string): Promise<T> {
  const file = join(PACKAGE_ROOT, "dist", "generated", group, kind, `${slug}.mjs`)
  return (await import(pathToFileURL(file).href)) as T
}

/** PNG pixel size from its IHDR chunk — no decoder needed. */
function pngSize(file: string): { width: number; height: number } {
  const header = readFileSync(file).subarray(0, 24)
  return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) }
}

/** One asset image's sources plus its catalog entry. */
async function assetImage(
  files: Map<string, AgentFile>,
  group: string,
  moduleSlug: string,
  paths: { svg: string; png: string },
  jsx: string,
  key: { variant?: string; tier?: CrestTier },
): Promise<CatalogImage> {
  const { svg } = await leaf<{ svg: string }>(group, "svg", moduleSlug)
  const { src } = await leaf<{ src: string }>(group, "png", moduleSlug)
  const pngFile = fileURLToPath(src)
  files.set(paths.svg, { contentType: SVG, read: () => svg })
  files.set(paths.png, { contentType: PNG, read: () => readFileSync(pngFile) })
  return {
    ...key,
    svg: absoluteUrl(paths.svg),
    png: absoluteUrl(paths.png),
    ...pngSize(pngFile),
    jsx,
    svgModule: `@posthog/brand/${group}/svg/${moduleSlug}`,
    pngModule: `@posthog/brand/${group}/png/${moduleSlug}`,
  }
}

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name)

async function hoggies(files: Map<string, AgentFile>): Promise<CatalogAsset[]> {
  // A variant family's members share a slug (and a component): group them into one entry.
  const families = new Map<string, AssetMeta[]>()
  for (const asset of findAssets({ namespace: "hoggies" })) {
    families.set(asset.slug, [...(families.get(asset.slug) ?? []), asset])
  }
  const entries: CatalogAsset[] = []
  for (const [slug, members] of families) {
    members.sort((a, b) => Number(a.variant?.variant ?? 0) - Number(b.variant?.variant ?? 0))
    const component = getComponentName("hoggies", slug)
    const images: CatalogImage[] = []
    for (const member of members) {
      const variant = member.variant?.variant
      images.push(
        await assetImage(
          files,
          "hoggies",
          hoggieStem(slug, variant),
          {
            svg: hoggieFilePath(slug, variant, "svg"),
            png: hoggieFilePath(slug, variant, "png"),
          },
          variant ? `<${component} variant="${variant}" />` : `<${component} />`,
          { variant },
        ),
      )
    }
    const page = hoggiePagePath(slug)
    entries.push({
      type: "hoggie",
      slug,
      name: members[0]!.name,
      tags: [...new Set(members.flatMap((m) => m.tags ?? []))],
      page: absoluteUrl(page),
      markdown: absoluteUrl(markdownPath(page)),
      component,
      import: `import { ${component} } from "@posthog/brand/hoggies"`,
      images,
    })
  }
  return entries.sort(byName)
}

async function crests(files: Map<string, AgentFile>): Promise<CatalogAsset[]> {
  const minis = new Set(findAssets({ namespace: "crests", tier: "mini" }).map((a) => a.slug))
  const entries: CatalogAsset[] = []
  for (const asset of findAssets({ namespace: "crests", tier: "full" })) {
    const { slug } = asset
    const component = getComponentName("crests", slug, "full")
    const tiers: CrestTier[] = minis.has(slug) ? ["full", "mini"] : ["full"]
    const images: CatalogImage[] = []
    for (const tier of tiers) {
      images.push(
        await assetImage(
          files,
          `crests/${tier}`,
          slug,
          { svg: crestFilePath(slug, tier, "svg"), png: crestFilePath(slug, tier, "png") },
          tier === "mini" ? `<${component}.Mini />` : `<${component} />`,
          { tier },
        ),
      )
    }
    const page = crestPagePath(slug)
    entries.push({
      type: "crest",
      slug,
      name: asset.name,
      tags: asset.tags ?? [],
      page: absoluteUrl(page),
      markdown: absoluteUrl(markdownPath(page)),
      component,
      import: `import { ${component} } from "@posthog/brand/crests"`,
      images,
    })
  }
  return entries.sort(byName)
}

function logos(files: Map<string, AgentFile>): CatalogLogo[] {
  return LOGO_FILES.map((file) => {
    const svgPath = logoFilePath(file.id, "svg")
    const pngPath = logoFilePath(file.id, "png")
    files.set(svgPath, { contentType: SVG, read: () => logoSvg(file) })
    files.set(pngPath, { contentType: PNG, read: () => logoPng(file) })
    const preset = LOGO_PRESETS.find((p) => p.file.id === file.id)
    return {
      id: file.id,
      title: file.title,
      layout: file.layout,
      treatment: file.treatment,
      frame: file.frame,
      background: file.treatment === "white" ? "dark" : "light",
      svg: absoluteUrl(svgPath),
      png: absoluteUrl(pngPath),
      ...logoPngSize(file),
      jsx: file.jsx,
      preset: preset ? { name: preset.name, when: preset.when } : undefined,
    }
  })
}

function brandColors(files: Map<string, AgentFile>): CatalogColor[] {
  files.set("/colors.css", { contentType: "text/css; charset=utf-8", read: () => colorsCss })
  const entries = Object.entries(colors)
    .map(([slug, color]) => ({
      slug,
      ...color,
      cssVariables: {
        core: `--posthog-${slug}`,
        lighter: `--posthog-${slug}-lighter`,
        darker: `--posthog-${slug}-darker`,
        gradient: `--posthog-${slug}-gradient`,
      },
    }))
    .sort(byName)
  files.set("/colors.json", {
    contentType: "application/json; charset=utf-8",
    read: () => `${JSON.stringify(entries, null, 2)}\n`,
  })
  return entries
}

function fonts(files: Map<string, AgentFile>): Catalog["fonts"] {
  const faces = roundHog.faces.map((face) => {
    const file = fileURLToPath(face.url)
    const name = basename(file)
    files.set(`/fonts/${name}`, { contentType: "font/woff2", read: () => readFileSync(file) })
    return { face, name }
  })
  // Relative URLs: the stylesheet sits next to the faces, so it works from any origin.
  const css = fontFaceCss({
    family: roundHog.family,
    faces: faces.map(({ face, name }) => ({ ...face, url: name })),
  })
  files.set("/fonts/roundhog.css", {
    contentType: "text/css; charset=utf-8",
    read: () => `${css}\n`,
  })
  return {
    family: roundHog.family,
    css: absoluteUrl("/fonts/roundhog.css"),
    faces: faces.map(({ face, name }) => ({
      weight: face.weight,
      style: face.style,
      woff2: absoluteUrl(`/fonts/${name}`),
    })),
  }
}

async function build(): Promise<AgentData> {
  const files = new Map<string, AgentFile>()
  const catalog: Catalog = {
    name: SITE_NAME,
    description: PAGES[0]!.description,
    site: `${SITE_URL}/`,
    docs: {
      llms: absoluteUrl("/llms.txt"),
      llmsFull: absoluteUrl("/llms-full.txt"),
      markdown: absoluteUrl(markdownPath("/")),
    },
    package: {
      name: "@posthog/brand",
      version: PACKAGE_VERSION,
      install: "npm install @posthog/brand",
      npm: "https://www.npmjs.com/package/@posthog/brand",
      repository: "https://github.com/PostHog/brand",
    },
    license: { summary: LICENSE_SUMMARY, url: LICENSE_URL },
    logos: logos(files),
    hoggies: await hoggies(files),
    crests: await crests(files),
    colors: brandColors(files),
    fonts: fonts(files),
  }
  files.set("/catalog.json", {
    contentType: "application/json; charset=utf-8",
    read: () => `${JSON.stringify(catalog, null, 2)}\n`,
  })
  return { catalog, files }
}

let cached: Promise<AgentData> | undefined

/** The agent-facing model, built once per process. */
export function loadAgentData(): Promise<AgentData> {
  cached ??= build()
  return cached
}
