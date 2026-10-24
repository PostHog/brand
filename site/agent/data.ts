// Everything the site publishes for agents, as one in-memory model:
//
//   • `catalog` — every logo file, hoggie, crest, color and font face, with absolute URLs to
//     its static files and the package import that renders it. Served as `/catalog.json`, and
//     the input to all the markdown (see markdown.ts) and to the WebMCP tools.
//   • `files` — site path → how to produce that file: each asset's SVG and PNG, the logo
//     renders, the woff2 faces, and the color tokens.
//
// Sources are imported from `@posthog/brand` through its exports map — the same modules npm
// consumers import — so a downloaded `/hoggies/chart.svg` is byte-for-byte the package's
// `@posthog/brand/hoggies/svg/chart`. Built once per process (`loadAgentData` is memoized) and
// shared by the build (agent-plugin.ts, seo-plugin.ts) and the dev server.

import {
  findAssets,
  getAsset,
  getComponentName,
  release,
  type CrestTier,
  type Release,
} from "@posthog/brand"
import { colorCssVariable, colors } from "@posthog/brand/colors"
import { colorsCss } from "@posthog/brand/colors/css"
import { roundHog } from "@posthog/brand/fonts"
import { fontFaceCss } from "@posthog/brand/fonts/css"
import { readFileSync } from "node:fs"
import { basename } from "node:path"
import { fileURLToPath } from "node:url"
import {
  absoluteUrl,
  assetFilePath,
  type AssetRef,
  assetPagePath,
  hoggieStem,
  markdownPath,
} from "../src/agent-paths.ts"
import { hoggieFamilies, hoggieJsx } from "../src/hoggie-families.ts"
import { LOGO_FILES, LOGO_PRESETS, type LogoFile } from "../src/logo-files.ts"
import { earliestSince } from "../src/release.ts"
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
  /** The package release that first shipped it (a family: its oldest member); absent if unreleased. */
  since?: Release
  /** Absolute URLs of the HTML page and its markdown twin. */
  page: string
  markdown: string
  /** React component name, and the import line that brings it in. */
  component: string
  import: string
  images: CatalogImage[]
}

export interface CatalogLogo {
  type: "logo"
  id: string
  title: string
  layout: LogoFile["layout"]
  treatment: LogoFile["treatment"]
  frame?: LogoFile["frame"]
  background: LogoFile["background"]
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
    /** Release date of `version` (UTC, `YYYY-MM-DD`). */
    released: string
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

/** A leaf module of the package, as consumers import it, e.g. `@posthog/brand/hoggies/svg/chart`. */
function leafModule(group: string, kind: "svg" | "png", slug: string): string {
  return `@posthog/brand/${group}/${kind}/${slug}`
}

/** PNG pixel size from its IHDR chunk — no decoder needed. */
function pngSize(file: string): { width: number; height: number } {
  const header = readFileSync(file).subarray(0, 24)
  return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) }
}

/** How one image is labelled in its asset's download list: "Variant 2", "Mini badge", … */
export function imageHeading(asset: CatalogAsset, image: CatalogImage): string {
  if (image.variant) return `Variant ${image.variant}`
  if (image.tier === "mini") return "Mini badge"
  return asset.type === "crest" ? "Full crest" : asset.name
}

/**
 * One asset image: registers its static files and returns its catalog entry. Imports go
 * through the package's exports map, so a broken `./<group>/svg/*` export fails the build
 * rather than shipping docs for module specifiers that don't resolve.
 */
async function assetImage(
  files: Map<string, AgentFile>,
  asset: AssetRef,
  group: string,
  moduleSlug: string,
  jsx: string,
): Promise<CatalogImage> {
  const svgModule = leafModule(group, "svg", moduleSlug)
  const pngModule = leafModule(group, "png", moduleSlug)
  const { src } = (await import(pngModule)) as { src: string }
  const pngFile = fileURLToPath(src)
  const svgPath = assetFilePath(asset, "svg")
  const pngPath = assetFilePath(asset, "png")
  // The markup is only loaded when the file is written or served — the catalog doesn't need it.
  files.set(svgPath, {
    contentType: SVG,
    read: async () => ((await import(svgModule)) as { svg: string }).svg,
  })
  files.set(pngPath, { contentType: PNG, read: () => readFileSync(pngFile) })
  return {
    variant: asset.variant,
    tier: asset.tier,
    svg: absoluteUrl(svgPath),
    png: absoluteUrl(pngPath),
    ...pngSize(pngFile),
    jsx,
    svgModule,
    pngModule,
  }
}

function assetEntry(
  type: CatalogAsset["type"],
  {
    slug,
    name,
    tags,
    since,
    component,
  }: Pick<CatalogAsset, "slug" | "name" | "tags" | "since" | "component">,
  images: CatalogImage[],
): CatalogAsset {
  const page = assetPagePath({ type, slug })
  return {
    type,
    slug,
    name,
    tags,
    since,
    page: absoluteUrl(page),
    markdown: absoluteUrl(markdownPath(page)),
    component,
    import: `import { ${component} } from "@posthog/brand/${type === "hoggie" ? "hoggies" : "crests"}"`,
    images,
  }
}

function byName(a: { name: string }, b: { name: string }): number {
  return a.name.localeCompare(b.name)
}

/** One entry per hoggie family: a numbered family is one component with a `variant` prop. */
async function hoggies(files: Map<string, AgentFile>): Promise<CatalogAsset[]> {
  const entries = await Promise.all(
    [...hoggieFamilies().values()].map(async (family) => {
      const { slug, component } = family
      const images = await Promise.all(
        family.members.map((member) => {
          const variant = member.variant?.variant
          return assetImage(
            files,
            { type: "hoggie", slug, variant },
            "hoggies",
            hoggieStem(slug, variant),
            hoggieJsx(component, variant),
          )
        }),
      )
      return assetEntry("hoggie", { ...family, since: earliestSince(family.members) }, images)
    }),
  )
  return entries.sort(byName)
}

async function crests(files: Map<string, AgentFile>): Promise<CatalogAsset[]> {
  const minis = new Set(findAssets({ namespace: "crests", tier: "mini" }).map((a) => a.slug))
  const entries = await Promise.all(
    findAssets({ namespace: "crests", tier: "full" }).map(async (asset) => {
      const { slug } = asset
      const component = getComponentName("crests", slug, "full")
      const tiers: CrestTier[] = minis.has(slug) ? ["full", "mini"] : ["full"]
      const images = await Promise.all(
        tiers.map((tier) =>
          assetImage(
            files,
            { type: "crest", slug, tier },
            `crests/${tier}`,
            slug,
            tier === "mini" ? `<${component}.Mini />` : `<${component} />`,
          ),
        ),
      )
      const since = earliestSince([asset, getAsset("crests", slug, "mini")])
      return assetEntry("crest", { ...asset, tags: asset.tags ?? [], since, component }, images)
    }),
  )
  return entries.sort(byName)
}

function logos(files: Map<string, AgentFile>): CatalogLogo[] {
  return LOGO_FILES.map((file) => {
    const svgPath = assetFilePath({ type: "logo", slug: file.id }, "svg")
    const pngPath = assetFilePath({ type: "logo", slug: file.id }, "png")
    files.set(svgPath, { contentType: SVG, read: () => logoSvg(file) })
    files.set(pngPath, { contentType: PNG, read: () => logoPng(file) })
    const preset = LOGO_PRESETS.find((p) => p.file.id === file.id)
    return {
      type: "logo",
      id: file.id,
      title: file.title,
      layout: file.layout,
      treatment: file.treatment,
      frame: file.frame,
      background: file.background,
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
        core: colorCssVariable(slug),
        lighter: colorCssVariable(slug, "lighter"),
        darker: colorCssVariable(slug, "darker"),
        gradient: colorCssVariable(slug, "gradient"),
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
  const serve = (url: string, dir: string): string => {
    const file = fileURLToPath(url)
    const name = `${dir}${basename(file)}`
    files.set(`/fonts/${name}`, { contentType: "font/woff2", read: () => readFileSync(file) })
    return name
  }
  const faces = roundHog.faces.map((face) => ({
    face,
    name: serve(face.url, ""),
    latinName: serve(face.latin.url, "latin/"),
  }))
  // Relative URLs: the stylesheet sits next to the faces, so it works from any origin.
  const css = fontFaceCss({
    family: roundHog.family,
    faces: faces.map(({ face, name, latinName }) => ({
      ...face,
      url: name,
      latin: { ...face.latin, url: latinName },
    })),
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
      version: release.version,
      released: release.date,
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
