// The markdown twin of every page, plus /llms.txt and /llms-full.txt. The prose lives in real
// markdown under `pages/` — edit it there; this file only builds the data-driven parts
// (tables, lists, counts) from the catalog (data.ts) and fills them into the `{{name}}`
// placeholders, so the docs an agent reads list exactly the files the site serves.
//
// `_two-ways.md` and `_license.md` are partials, available to every page as `{{twoWays}}` and
// `{{license}}`. An unknown placeholder fails the build rather than shipping as literal text.

import { readFileSync } from "node:fs"
import { absoluteUrl, assetPagePath, markdownPath, SITE_URL } from "../src/agent-paths.ts"
import { BADGE_SIZE, BADGE_USAGE } from "../src/badge-files.ts"
import { inPresetOrder, LOGO_DONTS, LOGO_DOS } from "../src/logo-files.ts"
import { PAGES } from "../src/seo.ts"
import { TOOL_DEFINITIONS } from "../src/webmcp-tools.ts"
import { type Catalog, type CatalogAsset, imageHeading } from "./data.ts"

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

/**
 * A table cell: no unescaped pipes or newlines. Backslashes are escaped first, so a value
 * ending in `\` can't turn the pipe escape into `\\|` (a literal backslash, then a bare pipe
 * that splits the cell).
 */
function cell(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\|/g, "\\|")
    .replace(/\s*\n\s*/g, " ")
}

function table(head: string[], rows: string[][]): string {
  return [
    `| ${head.join(" | ")} |`,
    `| ${head.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(cell).join(" | ")} |`),
  ].join("\n")
}

function link(label: string, url: string): string {
  return `[${label}](${url})`
}

function code(text: string): string {
  return `\`${text}\``
}

function list(items: readonly string[]): string {
  return items.map((item) => `- ${item}`).join("\n")
}

/** Placeholders every page can use. */
function sharedVars(catalog: Catalog): Vars {
  const base: Vars = {
    site: SITE_URL,
    install: catalog.package.install,
    version: catalog.package.version,
    released: catalog.package.released,
    licenseSummary: catalog.license.summary,
    licenseUrl: catalog.license.url,
    logoCount: catalog.logos.length,
    colorCount: catalog.colors.length,
    hoggieCount: catalog.hoggies.length,
    crestCount: catalog.crests.length,
    badgeCount: catalog.badges.length,
    // Every section page but the home page, as a markdown link list.
    sections: list(
      PAGES.filter((page) => page.path !== "/").map(
        (page) => `${link(page.label, absoluteUrl(markdownPath(page.path)))}: ${page.description}`,
      ),
    ),
  }
  return {
    ...base,
    twoWays: fill(template("_two-ways.md"), base).trim(),
    license: fill(template("_license.md"), base).trim(),
  }
}

/** Each section page's own placeholders, by its path in `PAGES` (template `pages/<name>.md`). */
const SECTION_VARS: Record<string, (catalog: Catalog) => Vars> = {
  "/": () => ({
    tools: list(TOOL_DEFINITIONS.map((tool) => `${code(tool.name)}: ${tool.description}`)),
  }),
  "/logo": (catalog) => ({
    presets: table(
      ["Version", "When to use it", "SVG", "PNG", "JSX"],
      inPresetOrder(catalog.logos).map((logo) => [
        logo.preset!.name,
        logo.preset!.when,
        link(`${logo.id}.svg`, logo.svg),
        link(`${logo.id}.png`, logo.png),
        logo.jsx ? code(logo.jsx) : "None",
      ]),
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
        logo.jsx ? code(logo.jsx) : "None (the padding is only in the file)",
      ]),
    ),
  }),
  "/fonts": (catalog) => ({
    faces: table(
      ["Weight", "Style", "Subsets", "Full face"],
      catalog.fonts.faces.map((face) => [
        String(face.weight),
        face.style,
        face.subsets.map((s) => link(s.name, s.woff2)).join(" · "),
        link(face.woff2, face.woff2),
      ]),
    ),
  }),
  "/colors": (catalog) => ({
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
  }),
  "/crests": (catalog) => ({
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
          mini ? link("SVG", mini.svg) : "None",
          mini ? link("PNG", mini.png) : "None",
          code(asset.component),
        ]
      }),
    ),
  }),
  "/badges": (catalog) => ({
    badgeSize: `${BADGE_SIZE.width}×${BADGE_SIZE.height}`,
    badges: table(
      ["Badge", "When to use it", "SVG", "PNG"],
      catalog.badges.map((badge) => [
        `${badge.name} (${code(badge.id)})`,
        badge.when,
        link(`${badge.id}.svg`, badge.svg),
        link(`PNG ${badge.width}×${badge.height}`, badge.png),
      ]),
    ),
    snippets: catalog.badges
      .map((badge) =>
        [
          `### ${badge.name}`,
          "",
          "For a website:",
          "",
          "```html",
          badge.html,
          "```",
          "",
          "For a README:",
          "",
          "```markdown",
          badge.markdown,
          "```",
        ].join("\n"),
      )
      .join("\n\n"),
    usage: list(BADGE_USAGE),
  }),
  "/hoggies": (catalog) => ({
    hoggies: table(
      ["Name", "Page", "Tags", "SVG", "PNG", "JSX"],
      catalog.hoggies.flatMap((asset) =>
        asset.images.map((image) => [
          image.variant ? `${asset.name} (variant ${image.variant})` : asset.name,
          link("page", asset.markdown),
          asset.tags.join(", "),
          link("SVG", image.svg),
          link(`PNG ${image.width}×${image.height}`, image.png),
          code(image.jsx),
        ]),
      ),
    ),
  }),
}

/** One hoggie's or crest's own page (`pages/hoggie.md` / `pages/crest.md`). */
function assetPage(asset: CatalogAsset, shared: Vars): string {
  const downloads = asset.images.map((image) =>
    [
      `### ${imageHeading(asset, image)}`,
      "",
      `- SVG: ${image.svg}`,
      `- PNG (${image.width}×${image.height}): ${image.png}`,
      `- JSX: ${code(image.jsx)}`,
      `- SVG string: ${code(`import svg from "${image.svgModule}"`)} · PNG URL: ${code(`import png from "${image.pngModule}"`)}`,
    ].join("\n"),
  )
  return fill(template(`${asset.type}.md`), {
    ...shared,
    name: asset.name,
    tags: asset.tags.length ? ` Tags: ${asset.tags.join(", ")}.` : "",
    since: asset.since
      ? ` Added in v${asset.since.version} (${asset.since.date}).`
      : " Not in a release yet.",
    page: asset.page,
    import: asset.import,
    jsx: asset.images.map((image) => image.jsx).join("\n"),
    family:
      asset.images.length > 1
        ? ` ${asset.name} is a numbered family: one component, picked with the \`variant\` prop.`
        : "",
    downloads: downloads.join("\n\n"),
  })
}

/** Site path → markdown for every page. */
export function markdownPages(catalog: Catalog): Map<string, string> {
  const shared = sharedVars(catalog)
  const pages = new Map<string, string>()
  for (const { path, description } of PAGES) {
    const file = markdownPath(path)
    pages.set(
      file,
      fill(template(file.slice(1)), { ...shared, description, ...SECTION_VARS[path]?.(catalog) }),
    )
  }
  for (const asset of [...catalog.hoggies, ...catalog.crests]) {
    pages.set(markdownPath(assetPagePath(asset)), assetPage(asset, shared))
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
    `${link(asset.name, asset.markdown)}: ${asset.images.map((image) => image.svg).join(", ")}${asset.tags.length ? ` (tags: ${asset.tags.join(", ")})` : ""}`
  return fill(template("llms.txt"), {
    ...sharedVars(catalog),
    description: PAGES[0]!.description,
    repository: catalog.package.repository,
    npm: catalog.package.npm,
    logos: list(
      inPresetOrder(catalog.logos).map(
        (logo) => `${logo.preset!.name} (${code(logo.id)}): ${logo.svg}. ${logo.preset!.when}`,
      ),
    ),
    // The link carries the URL, so no punctuation lands right after a bare one.
    badges: list(
      catalog.badges.map(
        (badge) =>
          `${link(badge.name, badge.svg)} (${code(badge.id)}, ${BADGE_SIZE.width}×${BADGE_SIZE.height} px): ${badge.when}`,
      ),
    ),
    hoggies: list(catalog.hoggies.map(assetLine)),
    crests: list(catalog.crests.map(assetLine)),
  })
}

/** `/llms-full.txt`: every section page's markdown, concatenated in nav order. */
export function llmsFullTxt(pages: Map<string, string>): string {
  const sections = PAGES.map((page) => pages.get(markdownPath(page.path))!.trim())
  return `${sections.join("\n\n---\n\n")}\n`
}
