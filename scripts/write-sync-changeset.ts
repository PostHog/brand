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
import { NAMESPACES } from "../src/types.ts"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")

function committed<T>(relPath: string): T | null {
  try {
    const raw = execSync(`git show HEAD:${relPath}`, { cwd: ROOT, encoding: "utf8" })
    return JSON.parse(raw) as T
  } catch {
    return null // first sync, or file didn't exist at HEAD
  }
}

const body: string[] = ["Sync brand assets from Figma.", ""]

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

  const added = [...curr.keys()].filter((s) => !prev.has(s)).sort()
  const removed = [...prev.keys()].filter((s) => !curr.has(s)).sort()
  const updated = [...curr.entries()]
    .filter(([s, e]) => prev.get(s) && JSON.stringify(prev.get(s)) !== JSON.stringify(e))
    .map(([s]) => s)
    .sort()

  if (added.length || removed.length || updated.length) {
    body.push(`**${ns}**`)
    if (added.length) body.push(`- Added ${added.length}: ${added.join(", ")}`)
    if (removed.length) body.push(`- Removed ${removed.length}: ${removed.join(", ")}`)
    if (updated.length) body.push(`- Updated ${updated.length}: ${updated.join(", ")}`)
    body.push("")
  }
}

if (body.length <= 2) {
  console.log("No catalog changes — skipping changeset.")
  process.exit(0)
}

const slug = process.env.GITHUB_RUN_ID ?? "local"
const file = join(ROOT, ".changeset", `brand-sync-${slug}.md`)
await writeFile(file, `---\n"@posthog/brand": minor\n---\n\n${body.join("\n").trim()}\n`)
console.log(`Wrote ${file}:\n${body.join("\n")}`)
