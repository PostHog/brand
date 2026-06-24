// Sync the PostHog brand-book Figma file into ./assets.
//
// The ONLY networked script. Walks the configured Figma pages, renders every asset to
// BOTH an optimized inline SVG and a bundled PNG, and writes one catalog.json per
// namespace plus sync-state.json. Assets whose Figma subtree is unchanged since the last
// sync are reused untouched, so a typical run re-renders only what actually changed.
// (The brand color palette is a fixed, hand-maintained list in static/colors.ts — not
// synced from Figma.) Run with `pnpm sync`.
//
// Flags:
//   --check   Report drift vs the committed catalogs and exit 1 if any; render nothing.
//   --force   Re-render every asset, ignoring sync-state (e.g. after a render-engine change).

import { createHash } from "node:crypto"
import { existsSync } from "node:fs"
import { mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import pLimit from "p-limit"
import type { AssetMeta, CrestTier, Namespace } from "../src/types.ts"
import { dedupeSlugs, slugify } from "../src/naming.ts"
import { FigmaClient, type FigmaNode } from "./lib/figma.ts"
import { optimizeSvg } from "./lib/svg.ts"
import { optimizePng } from "./lib/png.ts"
import { FIGMA_FILE_KEY, ILLUSTRATION_PAGES, type IllustrationPage } from "./lib/figma-pages.ts"
import type { Catalog, CatalogEntry, SyncState, SyncStateEntry } from "./lib/catalog.ts"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const ASSETS = join(ROOT, "assets")
const DOWNLOAD_CONCURRENCY = 8

/** A discovered asset before rendering: its identity + the Figma node to render. */
interface DiscoveredAsset {
  meta: AssetMeta
  node: FigmaNode
  /** Hash of the node subtree, for change detection. */
  hash: string
}

interface NamespaceSummary {
  namespace: Namespace
  added: string[]
  updated: string[]
  removed: string[]
  unchanged: number
}

function nsDir(namespace: Namespace): string {
  return join(ASSETS, namespace)
}

/** The on-disk folder for an asset's files: tiered crests nest under `<ns>/<tier>/`. */
function assetDir(namespace: Namespace, tier?: CrestTier): string {
  return tier ? join(nsDir(namespace), tier) : nsDir(namespace)
}

/** Stable key identifying an asset within the sync state / a catalog map (slug + tier). */
function assetKey(slug: string, tier?: CrestTier): string {
  return tier ? `${tier}/${slug}` : slug
}

function stateKey(namespace: Namespace, slug: string, tier?: CrestTier): string {
  return `${namespace}/${assetKey(slug, tier)}`
}

function hashNode(node: FigmaNode): string {
  return createHash("sha256").update(JSON.stringify(node)).digest("hex").slice(0, 16)
}

function titleCase(s: string): string {
  return s
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

function stripName(page: IllustrationPage, name: string): string {
  return page.stripPrefix ? name.replace(page.stripPrefix, "").trim() : name.trim()
}

/** "Orientation=Landscape, Logomark=Color (gradient)" -> { Orientation, Logomark }. */
function parseVariant(name: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const pair of name.split(",")) {
    const eq = pair.indexOf("=")
    if (eq === -1) continue
    out[pair.slice(0, eq).trim()] = pair.slice(eq + 1).trim()
  }
  return out
}

/** Build the base slug + display name (+ tier) for a COMPONENT_SET variant or bare COMPONENT. */
function identity(
  page: IllustrationPage,
  setName: string,
  setId: string,
  variant: Record<string, string> | undefined,
): { slug: string; name: string; tier?: CrestTier } {
  const stripped = stripName(page, setName)

  // Tier pages (crests): lift "Default"/"Mini" out of the slug into `tier`. Any other
  // value of the tier property (e.g. "plant") is a real variant and stays in the slug.
  if (page.tierVariantProp) {
    const tierVal = variant?.[page.tierVariantProp]
    const tier: CrestTier = tierVal?.toLowerCase() === "mini" ? "mini" : "full"
    const extras = Object.entries(variant ?? {})
      .filter(([k, v]) => {
        if (k !== page.tierVariantProp) return true
        const lv = v.toLowerCase()
        return lv !== "default" && lv !== "mini"
      })
      .map(([, v]) => v)
    const baseName = titleCase([stripped, ...extras].join(" "))
    const slug = [slugify(stripped), ...extras.map(slugify)].filter(Boolean).join("-")
    return { slug, name: tier === "mini" ? `${baseName} Mini` : baseName, tier }
  }

  if (!variant) {
    return { slug: slugify(stripped), name: titleCase(stripped) }
  }

  // Preserve Figma's variant-property order (as it appears in the node name) so logo
  // slugs read naturally, e.g. "landscape-color-gradient" not "color-gradient-landscape".
  const propValues = Object.keys(variant).map((k) => variant[k]!)

  if (page.setPrefixes) {
    const prefix = page.setPrefixes[setId] ?? slugify(stripped)
    const slug = [prefix, ...propValues.map(slugify)].filter(Boolean).join("-")
    const name = titleCase([prefix, ...propValues].filter(Boolean).join(" "))
    return { slug, name }
  }

  // Fallback for a variant page without setPrefixes/tierVariantProp: base slug with
  // non-"Default" variant values appended.
  const extras = propValues.filter((v) => v.toLowerCase() !== "default")
  const slug = [slugify(stripped), ...extras.map(slugify)].filter(Boolean).join("-")
  const name = titleCase([stripped, ...extras].join(" "))
  return { slug, name }
}

/** Walk a page container and flatten its COMPONENT / COMPONENT_SET nodes into assets. */
function discoverPage(page: IllustrationPage, container: FigmaNode): DiscoveredAsset[] {
  const raw: {
    slug: string
    name: string
    node: FigmaNode
    variant?: Record<string, string>
    tier?: CrestTier
  }[] = []

  for (const child of container.children ?? []) {
    if (child.type === "COMPONENT_SET") {
      for (const variantNode of child.children ?? []) {
        if (variantNode.type !== "COMPONENT") continue
        const variant = parseVariant(variantNode.name)
        const { slug, name, tier } = identity(page, child.name, child.id, variant)
        raw.push({ slug, name, node: variantNode, variant, tier })
      }
    } else if (child.type === "COMPONENT") {
      const { slug, name, tier } = identity(page, child.name, child.id, undefined)
      raw.push({ slug, name, node: child, tier })
    }
  }

  // Deterministic order, then disambiguate duplicate slugs *within each tier* — a full
  // and a mini crest sharing a base slug are distinct assets, not a collision.
  raw.sort((a, b) => a.slug.localeCompare(b.slug) || a.node.id.localeCompare(b.node.id))
  const finalSlugs: string[] = []
  for (const tier of new Set(raw.map((r) => r.tier))) {
    const idx = raw.map((_, i) => i).filter((i) => raw[i]!.tier === tier)
    const deduped = dedupeSlugs(idx.map((i) => raw[i]!.slug))
    idx.forEach((i, k) => (finalSlugs[i] = deduped[k]!))
  }

  return raw.map((r, i) => {
    const slug = finalSlugs[i]!
    if (slug !== r.slug) {
      console.warn(`  ! duplicate name in ${page.namespace}: "${r.name}" -> slug "${slug}"`)
    }
    // The tier property lives in `tier`, not `variant`; drop it so it isn't duplicated.
    const variant = r.variant
      ? Object.fromEntries(Object.entries(r.variant).filter(([k]) => k !== page.tierVariantProp))
      : undefined
    const hasVariant = variant && Object.keys(variant).length > 0
    const meta: AssetMeta = {
      slug,
      name: r.name,
      namespace: page.namespace,
      ...(r.tier ? { tier: r.tier } : {}),
      figmaNodeId: r.node.id,
      aspectRatio: 1,
      ...(hasVariant ? { variant } : {}),
    }
    return { meta, node: r.node, hash: hashNode(r.node) }
  })
}

/** Map of catalog entries keyed by slug+tier (slug alone isn't unique across crest tiers). */
async function readCatalog(namespace: Namespace): Promise<Map<string, CatalogEntry>> {
  const path = join(nsDir(namespace), "catalog.json")
  if (!existsSync(path)) return new Map()
  const catalog = JSON.parse(await readFile(path, "utf8")) as Catalog
  return new Map(catalog.entries.map((e) => [assetKey(e.slug, e.tier), e]))
}

async function readSyncState(): Promise<SyncState> {
  const path = join(ASSETS, "sync-state.json")
  if (!existsSync(path)) return { figmaFileKey: "", figmaVersion: "", entries: {} }
  return JSON.parse(await readFile(path, "utf8")) as SyncState
}

function filesPresent(namespace: Namespace, slug: string, tier?: CrestTier): boolean {
  return (
    existsSync(join(assetDir(namespace, tier), "vectors", `${slug}.svg`)) &&
    existsSync(join(assetDir(namespace, tier), "png", `${slug}.png`))
  )
}

/** Render + download + optimize one asset, writing its SVG and PNG. */
async function renderAsset(
  client: FigmaClient,
  asset: DiscoveredAsset,
  svgUrl: string,
  pngUrl: string,
): Promise<CatalogEntry> {
  const { namespace, slug, tier } = asset.meta
  const dir = assetDir(namespace, tier)
  await mkdir(join(dir, "vectors"), { recursive: true })
  await mkdir(join(dir, "png"), { recursive: true })

  const rawSvg = await client.downloadText(svgUrl)
  const optimized = optimizeSvg(rawSvg, `${namespace}-${slug}`)
  await writeFile(join(dir, "vectors", `${slug}.svg`), optimized.svg)

  const rawPng = await client.downloadBytes(pngUrl)
  const png = await optimizePng(rawPng)
  await writeFile(join(dir, "png", `${slug}.png`), png)

  return {
    ...asset.meta,
    aspectRatio: Math.round(optimized.aspectRatio * 10000) / 10000,
    svgBytes: Buffer.byteLength(optimized.svg),
    pngBytes: png.byteLength,
  }
}

async function main(): Promise<void> {
  const checkOnly = process.argv.includes("--check")
  const force = process.argv.includes("--force")
  const client = new FigmaClient()

  const fileMeta = await client.getFileMeta(FIGMA_FILE_KEY)
  const prevState = await readSyncState()
  console.log(
    `Figma "${fileMeta.name}" version ${fileMeta.version} (last modified ${fileMeta.lastModified})`,
  )

  // Early exit: nothing in the file changed and we already have a full sync on disk.
  if (
    !force &&
    !checkOnly &&
    prevState.figmaVersion === fileMeta.version &&
    prevState.figmaVersion
  ) {
    console.log("Figma version unchanged since last sync — nothing to do.")
    return
  }

  // Discovery: one getNodes call per illustration container. Colors are a fixed,
  // hand-maintained palette (static/colors.ts), not synced from Figma.
  const containerIds = ILLUSTRATION_PAGES.map((p) => p.containerId)
  const nodes = await client.getNodes(FIGMA_FILE_KEY, containerIds)

  const newState: SyncState = {
    figmaFileKey: FIGMA_FILE_KEY,
    figmaVersion: fileMeta.version,
    entries: {},
  }
  const summaries: NamespaceSummary[] = []
  const limit = pLimit(DOWNLOAD_CONCURRENCY)

  for (const page of ILLUSTRATION_PAGES) {
    const container = nodes[page.containerId]
    if (!container)
      throw new Error(`Container ${page.containerId} (${page.namespace}) not found in file.`)

    const discovered = discoverPage(page, container)
    const prevCatalog = await readCatalog(page.namespace)
    const summary: NamespaceSummary = {
      namespace: page.namespace,
      added: [],
      updated: [],
      removed: [],
      unchanged: 0,
    }

    // Removed = previously catalogued assets (slug+tier) no longer discovered.
    const discoveredKeys = new Set(discovered.map((d) => assetKey(d.meta.slug, d.meta.tier)))
    const removed: { slug: string; tier?: CrestTier }[] = []
    for (const [key, entry] of prevCatalog) {
      if (!discoveredKeys.has(key)) removed.push({ slug: entry.slug, tier: entry.tier })
    }
    summary.removed = removed.map((r) => assetKey(r.slug, r.tier))

    // Decide which assets need re-rendering.
    const toRender: DiscoveredAsset[] = []
    const reused: CatalogEntry[] = []
    for (const asset of discovered) {
      const { slug, tier } = asset.meta
      const prior = prevState.entries[stateKey(page.namespace, slug, tier)]
      const prevEntry = prevCatalog.get(assetKey(slug, tier))
      const unchanged =
        !force &&
        prior?.nodeHash === asset.hash &&
        prevEntry != null &&
        filesPresent(page.namespace, slug, tier)
      newState.entries[stateKey(page.namespace, slug, tier)] = {
        figmaNodeId: asset.meta.figmaNodeId,
        nodeHash: asset.hash,
      } satisfies SyncStateEntry
      if (unchanged) {
        reused.push(prevEntry)
        summary.unchanged++
      } else {
        toRender.push(asset)
        if (prevEntry) summary.updated.push(assetKey(slug, tier))
        else summary.added.push(assetKey(slug, tier))
      }
    }

    summaries.push(summary)

    if (checkOnly) continue

    await mkdir(nsDir(page.namespace), { recursive: true })

    // Remove dropped assets' files (tier-aware paths).
    for (const { slug, tier } of removed) {
      await rm(join(assetDir(page.namespace, tier), "vectors", `${slug}.svg`), { force: true })
      await rm(join(assetDir(page.namespace, tier), "png", `${slug}.png`), { force: true })
    }

    let entries: CatalogEntry[] = [...reused]
    if (toRender.length) {
      const ids = toRender.map((a) => a.meta.figmaNodeId)
      console.log(`${page.namespace}: rendering ${toRender.length} asset(s)…`)
      const [svgUrls, pngUrls] = await Promise.all([
        client.renderImages(FIGMA_FILE_KEY, ids, "svg"),
        client.renderImages(FIGMA_FILE_KEY, ids, "png", { scale: page.pngScale }),
      ])
      const rendered = await Promise.all(
        toRender.map((asset) =>
          limit(async () => {
            const svgUrl = svgUrls[asset.meta.figmaNodeId]
            const pngUrl = pngUrls[asset.meta.figmaNodeId]
            if (!svgUrl || !pngUrl) {
              console.warn(`  ! skipped ${asset.meta.slug}: Figma returned no image`)
              return null
            }
            const entry = await renderAsset(client, asset, svgUrl, pngUrl)
            console.log(`  ✓ ${page.namespace}/${asset.meta.slug}`)
            return entry
          }),
        ),
      )
      entries = [...entries, ...rendered.filter((e): e is CatalogEntry => e != null)]
    }

    entries.sort(
      (a, b) => a.slug.localeCompare(b.slug) || (a.tier ?? "").localeCompare(b.tier ?? ""),
    )
    const catalog: Catalog = {
      generatedAt: fileMeta.lastModified, // stable per Figma version → no spurious diffs
      figmaFileKey: FIGMA_FILE_KEY,
      figmaVersion: fileMeta.version,
      namespace: page.namespace,
      entries,
    }
    await writeFile(
      join(nsDir(page.namespace), "catalog.json"),
      `${JSON.stringify(catalog, null, 2)}\n`,
    )
  }

  if (checkOnly) {
    const drift = summaries.reduce(
      (n, s) => n + s.added.length + s.updated.length + s.removed.length,
      0,
    )
    console.log(JSON.stringify({ summaries, drift }, null, 2))
    process.exit(drift > 0 ? 1 : 0)
  }

  await writeFile(join(ASSETS, "sync-state.json"), `${JSON.stringify(newState, null, 2)}\n`)

  console.log(`\nSync summary:\n${JSON.stringify(summaries, null, 2)}`)
}

await main()
