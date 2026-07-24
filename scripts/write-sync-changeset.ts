// Writes a changeset describing what the latest sync changed, by diffing the working
// catalogs against the committed ones (per namespace). No-op (and no file) when nothing
// changed. Used by the sync workflow before it commits to main. (Colors are a fixed,
// hand-maintained palette in static/colors.ts — not synced, so not diffed here.)

import { execSync } from "node:child_process"
import { readFile, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import type { Catalog } from "./lib/catalog.ts"
import { NAMESPACES, type CrestTier, type Namespace } from "../src/types.ts"
import { applyRename } from "./lib/renames.ts"
import { publishedComponentName } from "./lib/published.ts"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")

// Baseline to diff the working catalogs against. Defaults to HEAD (the normal sync case);
// override to backfill — e.g. CHANGESET_BASE_REF=HEAD~1 to describe assets that were
// committed without a changeset, so every entry shows up as "added".
const BASE_REF = process.env.CHANGESET_BASE_REF ?? "HEAD"

function committed<T>(relPath: string): T | null {
  try {
    const raw = execSync(`git show ${BASE_REF}:${relPath}`, { cwd: ROOT, encoding: "utf8" })
    return JSON.parse(raw) as T
  } catch {
    return null // first sync, or file didn't exist at the baseline
  }
}

// Apply renames so the changelog reflects the published name, not the
// raw Figma label the catalog mirror keeps; minis keep their tier suffix.
const label = (e: { namespace: Namespace; slug: string; name: string; tier?: string }) => {
  const renamed = applyRename(e.namespace, e.slug, e.name).name
  return e.tier === "mini" && !renamed.endsWith(" Mini") ? `${renamed} Mini` : renamed
}

const sections: string[] = []
let totalAdded = 0
let totalRemoved = 0
// Removals measured on *published export identity* (variant grouping + renames), not the
// raw catalog slug: a Figma rename absorbed by renames.ts/variants.ts keeps the same
// export and is not breaking, whereas an export that truly disappears forces a major.
let totalBreaking = 0

for (const ns of NAMESPACES) {
  const rel = `assets/${ns}/catalog.json`
  const path = join(ROOT, rel)
  if (!existsSync(path)) continue
  const current = JSON.parse(await readFile(path, "utf8")) as Catalog
  const previous = committed<Catalog>(rel)

  // Key by slug+tier: crest full and mini variants share a slug but are distinct assets.
  const key = (e: { slug: string; tier?: string }) => (e.tier ? `${e.tier}/${e.slug}` : e.slug)
  const prev = new Map((previous?.entries ?? []).map((e) => [key(e), e]))
  const curr = new Map(current.entries.map((e) => [key(e), e]))

  const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name)
  const added = [...curr.keys()]
    .filter((s) => !prev.has(s))
    .map((s) => curr.get(s)!)
    .sort(byName)
  const removed = [...prev.keys()]
    .filter((s) => !curr.has(s))
    .map((s) => prev.get(s)!)
    .sort(byName)
  const updated = [...curr.entries()]
    .filter(([s, e]) => prev.get(s) && JSON.stringify(prev.get(s)) !== JSON.stringify(e))
    .map(([, e]) => e)
    .sort(byName)

  // A published export is "breaking" only if it existed before and no current entry
  // still maps to it (a rename that lands on the same export name is not a removal).
  const pub = (e: { slug: string; name: string; tier?: string }) =>
    publishedComponentName(ns, e.slug, e.name, e.tier as CrestTier | undefined)
  const currentExports = new Set([...curr.values()].map(pub))
  const breaking = [...prev.values()].map(pub).filter((name) => !currentExports.has(name))
  totalBreaking += new Set(breaking).size

  if (added.length || removed.length || updated.length) {
    totalAdded += added.length
    totalRemoved += removed.length

    const lines = [`**${ns}**`]
    if (added.length) lines.push(`- Added ${added.length}: ${added.map(label).join(", ")}`)
    if (removed.length) lines.push(`- Removed ${removed.length}: ${removed.map(label).join(", ")}`)
    if (updated.length) lines.push(`- Updated ${updated.length}: ${updated.map(label).join(", ")}`)

    sections.push(lines.join("\n"))
  }
}

if (sections.length === 0) {
  console.log("No catalog changes — skipping changeset.")
  process.exit(0)
}

// Accurate one-line summary (becomes the changelog headline), then the per-namespace detail.
const counts = [
  totalAdded ? `${totalAdded} added` : "",
  totalRemoved ? `${totalRemoved} removed` : "",
].filter(Boolean) as string[]

const headline = counts.length
  ? `Sync brand assets from Figma (${counts.join(", ")}).`
  : "Sync brand assets from Figma."
const body = [headline, ...sections].join("\n\n")

const slug = process.env.GITHUB_RUN_ID ?? "local"
const file = join(ROOT, ".changeset", `brand-sync-${slug}.md`)

// Minor for the common case (a sync adds, re-renders, or reshuffles assets behind the
// fully-namespaced API). A sync should never remove a published export — the guard in
// sync.ts blocks that unless ALLOW_BREAKING_REMOVALS was set — but if one did disappear,
// reflect it honestly as a major.
const bump = totalBreaking > 0 ? "major" : "minor"
await writeFile(file, `---\n"@posthog/brand": ${bump}\n---\n\n${body}\n`)
console.log(`Wrote ${file}:\n${body}`)
