// The markdown twin of every page, plus /llms.txt and /llms-full.txt — all generated from the
// catalog (data.ts), so the docs an agent reads list exactly the files the site serves.
//
// Every page leads with the same advice: in a JS/TS project, install `@posthog/brand` and
// import the asset (typed, offline, never goes stale); for anything else, download the static
// SVG/PNG by URL. The second half is what makes this site useful to agents that can't run a
// package manager — slides, docs, design tools, other languages.

import { absoluteUrl, crestPagePath, hoggiePagePath, markdownPath } from "../src/agent-paths.ts"
import { LOGO_DONTS, LOGO_DOS, LOGO_PRESETS } from "../src/logo-files.ts"
import { PAGES, SITE_NAME, SITE_URL } from "../src/seo.ts"
import { TOOL_DEFINITIONS } from "../src/webmcp-tools.ts"
import type { Catalog, CatalogAsset, CatalogImage, CatalogLogo } from "./data.ts"

const PACKAGE = "@posthog/brand"

/** A table cell: no pipes or newlines. */
function cell(text: string): string {
  return text.replace(/\|/g, "\\|").replace(/\s*\n\s*/g, " ")
}

function table(head: string[], rows: string[][]): string {
  return [
    `| ${head.join(" | ")} |`,
    `| ${head.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(cell).join(" | ")} |`),
  ].join("\n")
}

const link = (label: string, url: string) => `[${label}](${url})`
const code = (text: string) => `\`${text}\``
const fence = (lang: string, body: string) => `\`\`\`${lang}\n${body}\n\`\`\``

function pageDescription(path: string): string {
  return PAGES.find((page) => page.path === path)?.description ?? ""
}

/** Header every markdown page shares: title, summary, and where its HTML twin lives. */
function header(title: string, summary: string, pagePath: string): string {
  return [
    `# ${title}`,
    "",
    `> ${summary}`,
    "",
    `HTML version: ${absoluteUrl(pagePath)} · All docs for agents: ${absoluteUrl("/llms.txt")}`,
  ].join("\n")
}

const LICENSE_NOTE = (catalog: Catalog) =>
  `## License\n\n${catalog.license.summary} Full text: ${catalog.license.url}`

/** "Two ways to get any asset" — the package first, files second. */
function twoWays(catalog: Catalog): string {
  return [
    "## Two ways to get any asset",
    "",
    `**1. In a JavaScript/TypeScript project, use the npm package — it's the easiest route.** ${code(PACKAGE)} bundles every asset on this site as typed, tree-shakeable imports: React components, raw SVG strings and PNG URLs. It works offline, needs no CDN or API key, and can't break like a hotlinked file.`,
    "",
    fence("sh", `${catalog.package.install}   # or: pnpm add / yarn add / bun add ${PACKAGE}`),
    "",
    fence(
      "tsx",
      [
        `import { Logo } from "${PACKAGE}/logo"`,
        `import { HedgehogChart } from "${PACKAGE}/hoggies"           // React component`,
        `import hedgehogChartSvg from "${PACKAGE}/hoggies/svg/chart"   // SVG markup string, no React`,
        `import hedgehogChartPng from "${PACKAGE}/hoggies/png/chart"   // PNG URL, resolved by your bundler`,
        `import { MarketingCrest } from "${PACKAGE}/crests"`,
        `import { colors } from "${PACKAGE}/colors"`,
        `import { findAssets } from "${PACKAGE}"                        // search the catalog in code`,
        "",
        `<Logo />`,
        `<HedgehogChart size={96} />`,
        `<MarketingCrest size={64} />   <MarketingCrest.Mini size={24} />`,
      ].join("\n"),
    ),
    "",
    "**2. Anywhere else — slides, docs, a design tool, another language — download the file.** Every asset is a static file at a stable URL: no auth, no API key, CORS enabled. Prefer the SVG (it scales without losing quality); use the PNG where SVG isn't accepted.",
    "",
    table(
      ["Asset", "SVG", "PNG"],
      [
        [
          "Hoggie",
          `${SITE_URL}/hoggies/{slug}.svg`,
          `${SITE_URL}/hoggies/{slug}.png (about 1000 px)`,
        ],
        [
          "Hoggie variant (numbered family)",
          `${SITE_URL}/hoggies/{slug}-{variant}.svg`,
          `${SITE_URL}/hoggies/{slug}-{variant}.png`,
        ],
        ["Crest", `${SITE_URL}/crests/{slug}.svg`, `${SITE_URL}/crests/{slug}.png (600 px)`],
        [
          "Crest mini badge",
          `${SITE_URL}/crests/{slug}-mini.svg`,
          `${SITE_URL}/crests/{slug}-mini.png`,
        ],
        [
          "Logo",
          `${SITE_URL}/logo/{id}.svg`,
          `${SITE_URL}/logo/{id}.png (1600 px on the long side)`,
        ],
      ],
    ),
    "",
    fence("sh", `curl -O ${SITE_URL}/hoggies/chart.svg\ncurl -O ${SITE_URL}/logo/posthog-logo.png`),
    "",
    `Slugs, ids and exact PNG sizes are in the lists below and in the machine-readable catalog, ${absoluteUrl("/catalog.json")}.`,
  ].join("\n")
}

function imageRow(asset: CatalogAsset, image: CatalogImage): string[] {
  const which = image.variant
    ? `${asset.name} (variant ${image.variant})`
    : image.tier === "mini"
      ? `${asset.name} (mini)`
      : asset.name
  return [
    which,
    link("SVG", image.svg),
    link(`PNG ${image.width}×${image.height}`, image.png),
    code(image.jsx),
  ]
}

// ---- Pages --------------------------------------------------------------------------------

function indexMd(catalog: Catalog): string {
  const sections = PAGES.filter((page) => page.path !== "/").map(
    (page) => `- ${link(page.label, absoluteUrl(markdownPath(page.path)))}: ${page.description}`,
  )
  return [
    header(SITE_NAME, pageDescription("/"), "/"),
    "",
    `This site is the home of PostHog's brand assets: ${catalog.logos.length} logo files, the RoundHog typeface, ${catalog.colors.length} brand colors, ${catalog.hoggies.length} hedgehog illustrations ("hoggies") and ${catalog.crests.length} team crests.`,
    "",
    twoWays(catalog),
    "",
    "## Sections",
    "",
    ...sections,
    "",
    "## For agents",
    "",
    `- ${link("llms.txt", absoluteUrl("/llms.txt"))} — this index, with every asset listed. ${link("llms-full.txt", absoluteUrl("/llms-full.txt"))} — every page's markdown in one file.`,
    `- ${link("catalog.json", absoluteUrl("/catalog.json"))} — every logo, hoggie, crest, color and font face, with its file URLs, PNG size, JSX and package import.`,
    "- Every HTML page has a markdown twin: add `.md` to its URL (`/hoggies/chart` → `/hoggies/chart.md`; the home page is `/index.md`), or request the page with `Accept: text/markdown`.",
    `- ${link("colors.json", absoluteUrl("/colors.json"))} and ${link("colors.css", absoluteUrl("/colors.css"))} — the palette as data and as CSS custom properties. ${link("fonts/roundhog.css", absoluteUrl("/fonts/roundhog.css"))} — RoundHog's \`@font-face\` rules.`,
    "",
    "### WebMCP",
    "",
    "In a browser with WebMCP (`document.modelContext`), this site registers these tools:",
    "",
    ...TOOL_DEFINITIONS.map((tool) => `- ${code(tool.name)} — ${tool.description}`),
    "",
    LICENSE_NOTE(catalog),
    "",
  ].join("\n")
}

function logoRow(logo: CatalogLogo): string[] {
  return [
    code(logo.id),
    logo.title,
    logo.background === "dark" ? "dark" : "light",
    link("SVG", logo.svg),
    link(`PNG ${logo.width}×${logo.height}`, logo.png),
    logo.jsx ? code(logo.jsx) : "— (export-only padding)",
  ]
}

function logoMd(catalog: Catalog): string {
  const byId = new Map(catalog.logos.map((logo) => [logo.id, logo]))
  return [
    header("The PostHog logo", pageDescription("/logo"), "/logo"),
    "",
    "## Which logo to use",
    "",
    table(
      ["Version", "When to use it", "SVG", "PNG", "JSX"],
      LOGO_PRESETS.map((preset) => {
        const logo = byId.get(preset.file.id)!
        return [
          preset.name,
          preset.when,
          link(`${logo.id}.svg`, logo.svg),
          link(`${logo.id}.png`, logo.png),
          logo.jsx ? code(logo.jsx) : "—",
        ]
      }),
    ),
    "",
    "## Guidelines",
    "",
    "Do:",
    "",
    ...LOGO_DOS.map((item) => `- ${item}`),
    "",
    "Don't:",
    "",
    ...LOGO_DONTS.map((item) => `- ${item}`),
    "",
    "## In code",
    "",
    `The logo ships as one parametric React component, ${code(`import { Logo } from "${PACKAGE}/logo"`)}. It has no separate SVG/PNG exports; use the files below outside React.`,
    "",
    fence(
      "tsx",
      [
        `import { Logo } from "${PACKAGE}/logo"`,
        "",
        `<Logo />                                   // landscape lockup, full-color gradient`,
        `<Logo layout="stacked" />                  // logomark above the wordmark`,
        `<Logo variant="print" />                   // flat 4-color, for print`,
        `<Logo variant="mono" color="#fff" />       // single color (on dark backgrounds)`,
        `<Logo.Logomark size={32} />                // the hedgehog icon only`,
        `<Logo.Wordmark color="#000" />             // the "PostHog" wordmark only (always single-color)`,
        `<Logo.Logomark jumpOnClick />              // the logomark jumps when clicked`,
        `<Logo.Logomark holiday="christmas" />      // in a Santa hat (or "halloween")`,
      ].join("\n"),
    ),
    "",
    "Props: `layout` (`landscape` default, `stacked`, `logomark`, `wordmark`), `variant` (`gradient` default, `print`, `mono`), `color` (any CSS color, for `mono` and the wordmark; inherits `currentColor` when omitted), `size` (width in px, height follows), `title` (accessible label), plus every native `<svg>` prop.",
    "",
    `## Every logo file (${catalog.logos.length})`,
    "",
    'Each lockup in full color (`gradient`), 4-color print, black and white; the wordmark in black and white; and the logomark padded onto square and circle avatar canvases (for uploads that crop to a square or a circle). "For" is the background it is made for.',
    "",
    table(["Id", "Title", "For", "SVG", "PNG", "JSX"], catalog.logos.map(logoRow)),
    "",
    LICENSE_NOTE(catalog),
    "",
  ].join("\n")
}

function fontsMd(catalog: Catalog): string {
  const { fonts } = catalog
  return [
    header("RoundHog, PostHog's typeface", pageDescription("/fonts"), "/fonts"),
    "",
    "## In code",
    "",
    fence(
      "ts",
      [
        `import { roundHogFontFaceCss } from "${PACKAGE}/fonts/css"`,
        "",
        `const style = document.createElement("style")`,
        `style.textContent = roundHogFontFaceCss   // @font-face rules with the bundled woff2 URLs`,
        `document.head.appendChild(style)`,
        `// then: font-family: "RoundHog", sans-serif;`,
      ].join("\n"),
    ),
    "",
    `Or ${code(`import { roundHog } from "${PACKAGE}/fonts"`)} for the face metadata (family, weights, styles, URLs) to build your own \`@font-face\` or preload tags.`,
    "",
    "## Files",
    "",
    `A ready-made stylesheet: ${fonts.css} (relative URLs, CORS enabled — link it from anywhere).`,
    "",
    table(
      ["Weight", "Style", "woff2"],
      fonts.faces.map((face) => [String(face.weight), face.style, link(face.woff2, face.woff2)]),
    ),
    "",
    "Weights follow the PostHog app's type scale: Regular 400, Medium 500, SemiBold 700, Bold 800.",
    "",
    LICENSE_NOTE(catalog),
    "",
  ].join("\n")
}

function colorsMd(catalog: Catalog): string {
  return [
    header("The PostHog color palette", pageDescription("/colors"), "/colors"),
    "",
    table(
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
    "",
    "Each color also has `-lighter`, `-darker` and `-gradient` variables, e.g. `--posthog-blue-lighter`.",
    "",
    "## In code",
    "",
    fence(
      "ts",
      [
        `import { colors } from "${PACKAGE}/colors"`,
        `colors.blue.core   // "${catalog.colors.find((c) => c.slug === "blue")?.core ?? "#1490E8"}"`,
        "",
        `import { colorsCss } from "${PACKAGE}/colors/css"   // a :root { --posthog-… } block`,
      ].join("\n"),
    ),
    "",
    "## Files",
    "",
    `- ${absoluteUrl("/colors.json")} — the palette as JSON`,
    `- ${absoluteUrl("/colors.css")} — the CSS custom properties`,
    "",
  ].join("\n")
}

function hoggiesMd(catalog: Catalog): string {
  const rows = catalog.hoggies.flatMap((asset) =>
    asset.images.map((image) => {
      const [name = "", ...files] = imageRow(asset, image)
      return [name, link("page", asset.markdown), asset.tags.join(", "), ...files]
    }),
  )
  return [
    header("Hoggies — PostHog's hedgehogs", pageDescription("/hoggies"), "/hoggies"),
    "",
    "## In code",
    "",
    fence(
      "tsx",
      [
        `import { HedgehogChart } from "${PACKAGE}/hoggies"`,
        `<HedgehogChart size={96} title="A hedgehog with a chart" />`,
        "",
        `// Numbered families are one component with a \`variant\` prop:`,
        `<HedgehogConstruction variant="2" />`,
        "",
        `import hedgehogChartSvg from "${PACKAGE}/hoggies/svg/chart"   // SVG string`,
        `import hedgehogChartPng from "${PACKAGE}/hoggies/png/chart"   // PNG URL`,
        `import { findAssets } from "${PACKAGE}"`,
        `findAssets({ namespace: "hoggies", text: "coffee" })        // search by name/slug/tag`,
      ].join("\n"),
    ),
    "",
    "## Files",
    "",
    `${SITE_URL}/hoggies/{slug}.svg and .png; a variant family member is {slug}-{variant}. Each hoggie also has its own page with the details (the "page" links are its markdown).`,
    "",
    `## All ${catalog.hoggies.length} hoggies`,
    "",
    table(["Name", "Page", "Tags", "SVG", "PNG", "JSX"], rows),
    "",
    LICENSE_NOTE(catalog),
    "",
  ].join("\n")
}

function crestsMd(catalog: Catalog): string {
  const rows = catalog.crests.map((asset) => {
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
  })
  return [
    header("PostHog team crests", pageDescription("/crests"), "/crests"),
    "",
    "Each crest comes in two tiers: the full illustration and a simplified mini badge for small sizes.",
    "",
    "## In code",
    "",
    fence(
      "tsx",
      [
        `import { MarketingCrest } from "${PACKAGE}/crests"`,
        `<MarketingCrest size={64} />        // full illustration`,
        `<MarketingCrest.Mini size={24} />   // mini badge`,
        "",
        `import marketingCrestSvg from "${PACKAGE}/crests/full/svg/marketing"`,
        `import marketingCrestMiniPng from "${PACKAGE}/crests/mini/png/marketing"`,
      ].join("\n"),
    ),
    "",
    "## Files",
    "",
    `${SITE_URL}/crests/{slug}.svg and .png for the full crest; {slug}-mini for the badge.`,
    "",
    `## All ${catalog.crests.length} crests`,
    "",
    table(
      ["Name", "Page", "Tags", "Full SVG", "Full PNG", "Mini SVG", "Mini PNG", "Component"],
      rows,
    ),
    "",
    LICENSE_NOTE(catalog),
    "",
  ].join("\n")
}

/** One hoggie's or crest's own page. */
function assetMd(catalog: Catalog, asset: CatalogAsset): string {
  const isHoggie = asset.type === "hoggie"
  const pagePath = isHoggie ? hoggiePagePath(asset.slug) : crestPagePath(asset.slug)
  const kind = isHoggie ? 'hedgehog illustration (a "hoggie")' : "team crest"
  const summary = `${asset.name}, a PostHog ${kind}.${asset.tags.length ? ` Tags: ${asset.tags.join(", ")}.` : ""}`
  const family = isHoggie && asset.images.length > 1

  const downloads = asset.images.map((image) => {
    const label = image.variant
      ? `Variant ${image.variant}`
      : image.tier === "mini"
        ? "Mini badge"
        : isHoggie
          ? asset.name
          : "Full crest"
    return [
      `### ${label}`,
      "",
      `- SVG: ${image.svg}`,
      `- PNG (${image.width}×${image.height}): ${image.png}`,
      `- JSX: ${code(image.jsx)}`,
      `- SVG string: ${code(`import svg from "${image.svgModule}"`)} · PNG URL: ${code(`import png from "${image.pngModule}"`)}`,
    ].join("\n")
  })

  return [
    header(
      isHoggie ? `${asset.name} — PostHog hedgehog` : `${asset.name} crest — PostHog`,
      summary,
      pagePath,
    ),
    "",
    "## In code (recommended)",
    "",
    fence("tsx", [asset.import, "", ...asset.images.map((image) => image.jsx)].join("\n")),
    "",
    `Install with ${code(catalog.package.install)}.${family ? ` ${asset.name} is a numbered family: one component, picked with the \`variant\` prop.` : ""}${!isHoggie ? " The base component is the full illustration; `.Mini` is the badge." : ""}`,
    "",
    "## Download",
    "",
    ...downloads.flatMap((block) => [block, ""]),
    `More ${isHoggie ? "hoggies" : "crests"}: ${absoluteUrl(markdownPath(isHoggie ? "/hoggies" : "/crests"))}`,
    "",
    LICENSE_NOTE(catalog),
    "",
  ].join("\n")
}

// ---- Site-wide ----------------------------------------------------------------------------

/** Site path → markdown for every page. */
export function markdownPages(catalog: Catalog): Map<string, string> {
  const pages = new Map<string, string>([
    [markdownPath("/"), indexMd(catalog)],
    [markdownPath("/logo"), logoMd(catalog)],
    [markdownPath("/fonts"), fontsMd(catalog)],
    [markdownPath("/colors"), colorsMd(catalog)],
    [markdownPath("/crests"), crestsMd(catalog)],
    [markdownPath("/hoggies"), hoggiesMd(catalog)],
  ])
  for (const asset of [...catalog.hoggies, ...catalog.crests]) {
    const path = asset.type === "hoggie" ? hoggiePagePath(asset.slug) : crestPagePath(asset.slug)
    pages.set(markdownPath(path), assetMd(catalog, asset))
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
    `- ${link(asset.name, asset.markdown)}: ${asset.images.map((image) => image.svg).join(", ")}${asset.tags.length ? ` — ${asset.tags.join(", ")}` : ""}`
  return [
    `# ${SITE_NAME}`,
    "",
    `> ${pageDescription("/")}`,
    "",
    twoWays(catalog),
    "",
    "## Docs",
    "",
    `- ${link("Overview", absoluteUrl(markdownPath("/")))}: both ways in, plus the WebMCP tools this site registers`,
    ...PAGES.filter((page) => page.path !== "/").map(
      (page) => `- ${link(page.label, absoluteUrl(markdownPath(page.path)))}: ${page.description}`,
    ),
    `- ${link("catalog.json", absoluteUrl("/catalog.json"))}: every asset as JSON — file URLs, PNG sizes, JSX and package imports`,
    `- ${link("llms-full.txt", absoluteUrl("/llms-full.txt"))}: all of the above pages in one file`,
    "",
    "## Logo files",
    "",
    ...LOGO_PRESETS.map((preset) => {
      const logo = catalog.logos.find((l) => l.id === preset.file.id)!
      return `- ${preset.name} (${code(logo.id)}): ${logo.svg} — ${preset.when}`
    }),
    `- All ${catalog.logos.length} logo files (every color and canvas): ${absoluteUrl(markdownPath("/logo"))}`,
    "",
    `## Hoggies (${catalog.hoggies.length})`,
    "",
    ...catalog.hoggies.map(assetLine),
    "",
    `## Crests (${catalog.crests.length})`,
    "",
    ...catalog.crests.map(assetLine),
    "",
    "## Optional",
    "",
    `- ${link("Source code", catalog.package.repository)}: the ${code(PACKAGE)} package and this site`,
    `- ${link("npm", catalog.package.npm)}`,
    `- ${link("License", catalog.license.url)}: ${catalog.license.summary}`,
    "",
  ].join("\n")
}

/** `/llms-full.txt`: every section page's markdown, concatenated. */
export function llmsFullTxt(pages: Map<string, string>): string {
  const order = ["/", "/logo", "/fonts", "/colors", "/hoggies", "/crests"].map(markdownPath)
  return `${order.map((path) => pages.get(path)!.trim()).join("\n\n---\n\n")}\n`
}
