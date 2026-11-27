// What the asset tools answer, from the published catalog (`/catalog.json`): one implementation
// for both the WebMCP tools in the browser (webmcp.ts) and the remote MCP server at /mcp
// (functions/mcp.ts). Pure data in, data out: no DOM, no fetching, so either side can run it.

import type {
  Catalog,
  CatalogAsset,
  CatalogBadge,
  CatalogColor,
  CatalogLogo,
} from "../agent/data.ts"
import {
  absoluteUrl,
  type AssetRef,
  assetFileName,
  assetFilePath,
  type ImageFormat,
} from "./agent-paths.ts"
import { inPresetOrder, LOGO_DONTS, LOGO_DOS } from "./logo-files.ts"

/** A tool-level failure the agent can read and recover from (MCP's `isError` result shape). */
export interface ToolFailure {
  isError: true
  content: { type: "text"; text: string }[]
}

export function failure(text: string): ToolFailure {
  return { isError: true, content: [{ type: "text", text }] }
}

export function isFailure(value: unknown): value is ToolFailure {
  return !!value && typeof value === "object" && (value as ToolFailure).isError === true
}

/** Any catalog entry a tool can return: a hoggie, a crest, a logo file, or a website badge. */
export type Entry = CatalogAsset | CatalogLogo | CatalogBadge

export type Input = Record<string, unknown>

export const str = (value: unknown): string => (typeof value === "string" ? value : "")

interface Hit {
  type: AssetRef["type"]
  name: string
  haystack: string
  value: Entry
}

function hits(catalog: Catalog): Hit[] {
  const asset = (entry: CatalogAsset): Hit => ({
    type: entry.type,
    name: entry.name,
    haystack: `${entry.name} ${entry.slug} ${entry.tags.join(" ")}`,
    value: entry,
  })
  const logo = (entry: CatalogLogo): Hit => ({
    type: "logo",
    name: entry.title,
    haystack: `${entry.id} ${entry.title} ${entry.layout} ${entry.treatment} ${entry.frame ?? ""} ${entry.preset?.name ?? ""} ${entry.background} background`,
    value: entry,
  })
  const badge = (entry: CatalogBadge): Hit => ({
    type: "badge",
    name: entry.name,
    haystack: `${entry.id} ${entry.name} ${entry.background} background built with posthog website badge footer readme embed`,
    value: entry,
  })
  return [
    ...catalog.logos.map(logo),
    ...catalog.badges.map(badge),
    ...catalog.hoggies.map(asset),
    ...catalog.crests.map(asset),
  ]
}

export function searchAssets(
  catalog: Catalog,
  input: Input,
): { total: number; results: Entry[]; note: string } {
  const query = str(input.query).trim().toLowerCase()
  const words = query.split(/\s+/).filter(Boolean)
  const type = str(input.type)
  const limit = Math.min(50, Math.max(1, Number(input.limit) || 10))
  const matches = hits(catalog)
    .filter((hit) => !type || hit.type === type)
    .filter((hit) => {
      const haystack = hit.haystack.toLowerCase()
      return words.every((word) => haystack.includes(word))
    })
    // Whole-query name matches first, then alphabetical. Badges keep catalog order (the sort is
    // stable), so the standard one, the default, comes before the dark one.
    .sort(
      (a, b) =>
        Number(b.name.toLowerCase().includes(query)) -
          Number(a.name.toLowerCase().includes(query)) ||
        (a.type === "badge" && b.type === "badge" ? 0 : a.name.localeCompare(b.name)),
    )
  return {
    total: matches.length,
    results: matches.slice(0, limit).map((hit) => hit.value),
    note: "Prefer the SVG URL; in a JS/TS project, `npm install @posthog/brand` and use the `import` instead of downloading. For a website badge, paste its `html` or `markdown`, which link to posthog.com.",
  }
}

export function findEntry(catalog: Catalog, type: string, slug: string): Entry | undefined {
  if (type === "logo") return catalog.logos.find((logo) => logo.id === slug)
  if (type === "badge") return catalog.badges.find((badge) => badge.id === slug)
  const list = type === "hoggie" ? catalog.hoggies : type === "crest" ? catalog.crests : []
  return list.find((entry) => entry.slug === slug)
}

export function getAsset(catalog: Catalog, input: Input): Entry | ToolFailure {
  const type = str(input.type)
  const slug = str(input.slug)
  const entry = findEntry(catalog, type, slug)
  if (!entry) return failure(`No ${type} with slug "${slug}". Use search_brand_assets to find it.`)
  return entry
}

export function logoGuidelines(catalog: Catalog): {
  presets: CatalogLogo[]
  dos: readonly string[]
  donts: readonly string[]
  allFiles: CatalogLogo[]
  react: string
} {
  return {
    // The handbook's approved versions; each carries `preset: { name, when }`.
    presets: inPresetOrder(catalog.logos),
    dos: LOGO_DOS,
    donts: LOGO_DONTS,
    allFiles: catalog.logos,
    react:
      'import { Logo } from "@posthog/brand/logo" — <Logo />, <Logo layout="stacked" />, <Logo variant="mono" color="#fff" />, <Logo.Logomark />',
  }
}

export function brandColors(catalog: Catalog): {
  colors: CatalogColor[]
  css: string
  json: string
  package: string
} {
  return {
    colors: catalog.colors,
    css: absoluteUrl("/colors.css"),
    json: absoluteUrl("/colors.json"),
    package: 'import { colors } from "@posthog/brand/colors"',
  }
}

/** One asset file: where it's served and what to call it. */
export interface AssetFile {
  asset: AssetRef
  format: ImageFormat
  /** Site path, e.g. "/hoggies/chart.svg". */
  path: string
  fileName: string
}

/**
 * The file a request names (type, slug, format, and a hoggie's `variant` or a crest's `tier`),
 * or why there's none.
 */
export function assetFile(catalog: Catalog, input: Input): AssetFile | ToolFailure {
  const type = str(input.type)
  const slug = str(input.slug)
  const format: ImageFormat = str(input.format) === "png" ? "png" : "svg"
  const entry = findEntry(catalog, type, slug)
  if (!entry) return failure(`No ${type} with slug "${slug}". Use search_brand_assets to find it.`)

  let asset: AssetRef = { type: entry.type === "badge" ? "badge" : "logo", slug }
  if (entry.type === "hoggie" || entry.type === "crest") {
    const { images } = entry
    const image =
      entry.type === "crest"
        ? images.find((img) => img.tier === (str(input.tier) || "full"))
        : (images.find((img) => img.variant === str(input.variant)) ?? images[0])
    if (!image) return failure(`${entry.name} has no ${str(input.tier)} tier.`)
    asset = { type: entry.type, slug, variant: image.variant, tier: image.tier }
  }
  return {
    asset,
    format,
    path: assetFilePath(asset, format),
    fileName: `${assetFileName(asset)}.${format}`,
  }
}
