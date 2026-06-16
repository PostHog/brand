// Writes a changeset describing what the latest sync changed, by diffing the
// working catalog against the committed one. No-op (and no file) when nothing
// changed. Used by the sync workflow before it commits to main.

import { execSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Catalog } from "./lib/catalog.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = join(ROOT, "assets", "catalog.json");

function committedCatalog(): Catalog | null {
  try {
    const raw = execSync("git show HEAD:assets/catalog.json", { cwd: ROOT, encoding: "utf8" });
    return JSON.parse(raw) as Catalog;
  } catch {
    return null; // first sync — no committed catalog yet
  }
}

const current = JSON.parse(await readFile(CATALOG, "utf8")) as Catalog;
const previous = committedCatalog();

const prevBySlug = new Map((previous?.entries ?? []).map((e) => [e.slug, e]));
const currBySlug = new Map(current.entries.map((e) => [e.slug, e]));

const added = [...currBySlug.keys()].filter((s) => !prevBySlug.has(s)).sort();
const removed = [...prevBySlug.keys()].filter((s) => !currBySlug.has(s)).sort();
const reDelivered = [...currBySlug.entries()]
  .filter(([s, e]) => prevBySlug.get(s) && prevBySlug.get(s)!.delivery !== e.delivery)
  .map(([s, e]) => `${s} (${prevBySlug.get(s)!.delivery} → ${e.delivery})`)
  .sort();

// Metadata-only changes (same delivery, different tags/caption/etc.) still warrant
// a release so consumers get the update.
const updated = [...currBySlug.entries()]
  .filter(([s, e]) => {
    const prev = prevBySlug.get(s);
    return prev && prev.delivery === e.delivery && JSON.stringify(prev) !== JSON.stringify(e);
  })
  .map(([s]) => s)
  .sort();

if (
  added.length === 0 &&
  removed.length === 0 &&
  reDelivered.length === 0 &&
  updated.length === 0
) {
  console.log("No catalog changes — skipping changeset.");
  process.exit(0);
}

const body: string[] = ["Sync hedgehog catalog from the art pipeline.", ""];
if (added.length) body.push(`- Added ${added.length}: ${added.join(", ")}`);
if (removed.length) body.push(`- Removed ${removed.length}: ${removed.join(", ")}`);
if (reDelivered.length) body.push(`- Re-delivered: ${reDelivered.join(", ")}`);
if (updated.length) body.push(`- Updated metadata ${updated.length}: ${updated.join(", ")}`);

const slug = process.env.GITHUB_RUN_ID ?? `${current.entries.length}`;
const file = join(ROOT, ".changeset", `art-sync-${slug}.md`);
await writeFile(file, `---\n"@posthog/hedgehogs": minor\n---\n\n${body.join("\n")}\n`);
console.log(`Wrote ${file}:\n${body.join("\n")}`);
