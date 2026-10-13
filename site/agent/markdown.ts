// The markdown twin of every page, plus /llms.txt and /llms-full.txt. The prose lives in real
// markdown under `pages/` — edit it there; this file only builds the data-driven parts
// (tables, lists, counts) from the catalog (data.ts) and fills them into the `{{name}}`
// placeholders, so the docs an agent reads list exactly the files the site serves.
//
// `_two-ways.md` and `_license.md` are partials, available to every page as `{{twoWays}}` and
// `{{license}}`. An unknown placeholder fails the build rather than shipping as literal text.

import { readFileSync } from "node:fs"
import { crestPagePath, hoggiePagePath, markdownPath } from "../src/agent-paths.ts"
import { LOGO_DONTS, LOGO_DOS, LOGO_PRESETS } from "../src/logo-files.ts"
import { PAGES, SITE_URL } from "../src/seo.ts"
import { TOOL_DEFINITIONS } from "../src/webmcp-tools.ts"
import type { Catalog, CatalogAsset, CatalogImage } from "./data.ts"

type Vars = Record<string, string | number>

function template(name: string): string {
  return readFileSync(new URL(`./pages/${name}`, import.meta.url), "utf8")
}

function fill(text: string, vars: Vars): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    if (!(key in vars)) throw new Error(`agent/pages: no value for {{${key}}}`)
    return String(vars[key])
  })
}

/** A table cell: no pipes or newlines. */
const cell = (text: string) => text.replace(/\|/g, "\\|").replace(/\s*\n\s*/g, " ")

function table(head: string[], rows: string[][]): string {
  return [
    `| ${head.join(" | ")} |`,
    `| ${head.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(cell).join(" | ")} |`),
  ].join("\n")
}

const link = (label: string, url: string) => `[${label}](${url})`
const code = (text: string) => `\`${text}\``
const list = (items: readonly string[]) => items.map((item) => `- ${item}`).join("\n")
const tagPhrase = (asset: CatalogAsset) =>
  asset.tags.length ? ` Tags: ${asset.tags.join(", ")}.` : ""

/** Placeholders every page can use. */
function sharedVars(catalog: Catalog): Vars {
  const base: Vars = {
    site: SITE_URL,
    install: catalog.package.install,
    licenseSummary: catalog.license.summary,
    licenseUrl: catalog.license.url,
    logoCount: catalog.logos.length,
    colorCount: catalog.colors.length,
    hoggieCount: catalog.hoggies.length,
    crestCount: catalog.crests.length,
    // Every section page but the home page, as a markdown link list.
    sections: list(
      PAGES.filter((page) => page.path !== "/").map(
        (page) =>
          `${link(page.label, `${SITE_URL}${markdownPath(page.path)}`)}: ${page.description}`,
      ),
    ),
  }
  return {
    ...base,
    twoWays: fill(template("_two-ways.md"), base).trim(),
    license: fill(template("_license.md"), base).trim(),
  }
}

function page(name: string, vars: Vars, path: string): string {
  const description = PAGES.find((p) => p.path === path)?.description ?? ""
  return fill(template(name), { description, ...vars })
}

function imageLabel(asset: CatalogAsset, image: CatalogImage): string {
  if (image.variant) return `${asset.name} (variant ${image.variant})`
  return image.tier === "mini" ? `${asset.name} (mini)` : asset.name
}

/** The "Download" section of one hoggie's or crest's page: one block per variant or tier. */
function downloads(asset: CatalogAsset): string {
  return asset.images
    .map((image) => {
      const heading = image.variant
        ? `Variant ${image.variant}`
        : image.tier === "mini"
          ? "Mini badge"
          : asset.type === "crest"
            ? "Full crest"
            : asset.name
      return [
        `### ${heading}`,
        "",
        `- SVG: ${image.svg}`,
        `- PNG (${image.width}×${image.height}): ${image.png}`,
        `- JSX: ${code(image.jsx)}`,
        `- SVG string: ${code(`import svg from "${image.svgModule}"`)} · PNG URL: ${code(`import png from "${image.pngModule}"`)}`,
      ].join("\n")
    })
    .join("\n\n")
}

function assetVars(asset: CatalogAsset): Vars {
  const family = asset.images.length > 1 && asset.type === "hoggie"
  return {
    name: asset.name,
    tags: tagPhrase(asset),
    page: asset.page,
    import: asset.import,
    jsx: asset.images.map((image) => image.jsx).join("\n"),
    family: family
      ? ` ${asset.name} is a numbered family: one component, picked with the \`variant\` prop.`
      : "",
    downloads: downloads(asset),
  }
}

/** Site path → markdown for every page. */
export function markdownPages(catalog: Catalog): Map<string, string> {
  const shared = sharedVars(catalog)
  const logoById = new Map(catalog.logos.map((logo) => [logo.id, logo]))

  const pages = new Map<string, string>([
    [
      markdownPath("/"),
      page(
        "index.md",
        {
          ...shared,
          tools: list(TOOL_DEFINITIONS.map((tool) => `${code(tool.name)} — ${tool.description}`)),
        },
        "/",
      ),
    ],
    [
      markdownPath("/logo"),
      page(
        "logo.md",
        {
          ...shared,
          presets: table(
            ["Version", "When to use it", "SVG", "PNG", "JSX"],
            LOGO_PRESETS.map((preset) => {
              const logo = logoById.get(preset.file.id)!
              return [
                preset.name,
                preset.when,
                link(`${logo.id}.svg`, logo.svg),
                link(`${logo.id}.png`, logo.png),
                logo.jsx ? code(logo.jsx) : "—",
              ]
            }),
          ),
          dos: list(LOGO_DOS),
          donts: list(LOGO_DONTS),
          files: table(
            ["Id", "Title", "For", "SVG", "PNG", "JSX"],
            catalog.logos.map((logo) => [
              code(logo.id),
              logo.title,
              logo.background,
              link("SVG", logo.svg),
              link(`PNG ${logo.width}×${logo.height}`, logo.png),
              logo.jsx ? code(logo.jsx) : "— (export-only padding)",
            ]),
          ),
        },
        "/logo",
      ),
    ],
    [
      markdownPath("/fonts"),
      page(
        "fonts.md",
        {
          ...shared,
          faces: table(
            ["Weight", "Style", "woff2"],
            catalog.fonts.faces.map((face) => [
              String(face.weight),
              face.style,
              link(face.woff2, face.woff2),
            ]),
          ),
        },
        "/fonts",
      ),
    ],
    [
      markdownPath("/colors"),
      page(
        "colors.md",
        {
          ...shared,
          blue: catalog.colors.find((color) => color.slug === "blue")?.core ?? "",
          colors: table(
            ["Color", "Core", "Lighter", "Darker", "Gradient", "CSS variable"],
            catalog.colors.map((color) => [
              color.name,
              code(color.core),
              code(color.lighter),
              code(color.darker),
              `${code(color.gradient[0])} → ${code(color.gradient[1])}`,
              code(`var(${color.cssVariables.core})`),
            ]),
          ),
        },
        "/colors",
      ),
    ],
    [
      markdownPath("/hoggies"),
      page(
        "hoggies.md",
        {
          ...shared,
          hoggies: table(
            ["Name", "Page", "Tags", "SVG", "PNG", "JSX"],
            catalog.hoggies.flatMap((asset) =>
              asset.images.map((image) => [
                imageLabel(asset, image),
                link("page", asset.markdown),
                asset.tags.join(", "),
                link("SVG", image.svg),
                link(`PNG ${image.width}×${image.height}`, image.png),
                code(image.jsx),
              ]),
            ),
          ),
        },
        "/hoggies",
      ),
    ],
    [
      markdownPath("/crests"),
      page(
        "crests.md",
        {
          ...shared,
          crests: table(
            ["Name", "Page", "Tags", "Full SVG", "Full PNG", "Mini SVG", "Mini PNG", "Component"],
            catalog.crests.map((asset) => {
              const full = asset.images.find((image) => image.tier === "full")!
              const mini = asset.images.find((image) => image.tier === "mini")
              return [
                asset.name,
                link("page", asset.markdown),
                asset.tags.join(", "),
                link("SVG", full.svg),
                link("PNG", full.png),
                mini ? link("SVG", mini.svg) : "—",
                mini ? link("PNG", mini.png) : "—",
                code(asset.component),
              ]
            }),
          ),
        },
        "/crests",
      ),
    ],
  ])

  for (const asset of catalog.hoggies) {
    pages.set(
      markdownPath(hoggiePagePath(asset.slug)),
      fill(template("hoggie.md"), { ...shared, ...assetVars(asset) }),
    )
  }
  for (const asset of catalog.crests) {
    pages.set(
      markdownPath(crestPagePath(asset.slug)),
      fill(template("crest.md"), { ...shared, ...assetVars(asset) }),
    )
  }
  return pages
}

/**
 * `/llms.txt` (llmstxt.org): what the site is, how to get assets, and a link to the markdown
 * for every page — every hoggie and crest included, by name and tags, so an agent can pick
 * one without fetching anything else.
 */
export function llmsTxt(catalog: Catalog): string {
  const assetLine = (asset: CatalogAsset) =>
    `${link(asset.name, asset.markdown)}: ${asset.images.map((image) => image.svg).join(", ")}${asset.tags.length ? ` — ${asset.tags.join(", ")}` : ""}`
  return page(
    "llms.txt",
    {
      ...sharedVars(catalog),
      repository: catalog.package.repository,
      npm: catalog.package.npm,
      logos: list(
        LOGO_PRESETS.map((preset) => {
          const logo = catalog.logos.find((l) => l.id === preset.file.id)!
          return `${preset.name} (${code(logo.id)}): ${logo.svg} — ${preset.when}`
        }),
      ),
      hoggies: list(catalog.hoggies.map(assetLine)),
      crests: list(catalog.crests.map(assetLine)),
    },
    "/",
  )
}

/** `/llms-full.txt`: every section page's markdown, concatenated. */
export function llmsFullTxt(pages: Map<string, string>): string {
  const order = ["/", "/logo", "/fonts", "/colors", "/hoggies", "/crests"].map(markdownPath)
  return `${order.map((path) => pages.get(path)!.trim()).join("\n\n---\n\n")}\n`
}
