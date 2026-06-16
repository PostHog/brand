// Sync the public art-library catalog into ./assets.
//
// The ONLY networked script. Downloads a 768px PNG for every asset and the source
// SVG for assets that optimize under the inline budget, then writes catalog.json,
// tags.json, and sync-state.json. Run with `pnpm sync` (Node 24, no transpile step).
//
// Flags:
//   --check   Report drift vs the committed catalog and exit 1 if any; download nothing.

import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pLimit from "p-limit";
import type {
  Catalog,
  CatalogEntry,
  IndexEntry,
  SearchIndex,
  SyncState,
  TagsIndex,
} from "./lib/catalog.ts";
import { optimizeSvg } from "./lib/svg.ts";

const BASE = "https://posthog-art-library.vercel.app"; // TODO: Point to a better URL once there is one
const INDEX_URL = `${BASE}/data/index.json`;
const TAGS_URL = `${BASE}/data/tags.json`;

// r2.dev rejects non-browser User-Agents with 403, so we present a browser one.
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

const INLINE_BUDGET = 512 * 1024; // optimized SVG must fit this to ship as a vector
const MAX_RAW_FOR_INLINE = 2 * 1024 * 1024; // skip downloading vectors larger than this
const CONCURRENCY = 8;

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ASSETS = join(ROOT, "assets");
const VECTORS = join(ASSETS, "vectors");
const PNGS = join(ASSETS, "png");

interface SyncSummary {
  added: string[];
  updated: string[];
  removed: string[];
  unchanged: number;
  svgCount: number;
  pngCount: number;
}

async function fetchRetry(url: string, attempts = 3): Promise<Response> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (res.ok) return res;
      lastErr = new Error(`${res.status} ${res.statusText} for ${url}`);
    } catch (err) {
      lastErr = err;
    }
    await new Promise((r) => setTimeout(r, 1000 * 2 ** i));
  }
  throw lastErr;
}

async function fetchJson<T>(url: string): Promise<T> {
  return (await (await fetchRetry(url)).json()) as T;
}

function hashEntry(entry: IndexEntry): string {
  return createHash("sha256").update(JSON.stringify(entry)).digest("hex").slice(0, 16);
}

/** Reads width/height from a PNG's IHDR chunk → aspect ratio. */
function pngAspectRatio(bytes: Uint8Array): number {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const width = view.getUint32(16);
  const height = view.getUint32(20);
  return width && height ? width / height : 1;
}

async function readExistingCatalog(): Promise<Map<string, CatalogEntry>> {
  const path = join(ASSETS, "catalog.json");
  if (!existsSync(path)) return new Map();
  const catalog = JSON.parse(await readFile(path, "utf8")) as Catalog;
  return new Map(catalog.entries.map((e) => [e.slug, e]));
}

async function readSyncState(): Promise<SyncState> {
  const path = join(ASSETS, "sync-state.json");
  if (!existsSync(path)) return { source: "", entries: {} };
  return JSON.parse(await readFile(path, "utf8")) as SyncState;
}

/** Downloads + classifies one asset, writing its PNG (always) and SVG (if it fits). */
async function processAsset(entry: IndexEntry): Promise<CatalogEntry> {
  const { slug } = entry;

  // 1. PNG (every asset) — the universal offline fallback.
  const pngRes = await fetchRetry(entry.files.md);
  const pngBytes = new Uint8Array(await pngRes.arrayBuffer());
  await writeFile(join(PNGS, `${slug}.png`), pngBytes);

  // 2. SVG (best effort). Skip the download entirely when the source is huge.
  let delivery: "svg" | "png" = "png";
  let rawVectorBytes: number | null = null;
  let inlineVectorBytes: number | null = null;
  let aspectRatio = pngAspectRatio(pngBytes);
  const vectorPath = join(VECTORS, `${slug}.svg`);
  await rm(vectorPath, { force: true }); // clear any stale vector before re-deciding

  try {
    const res = await fetchRetry(entry.files.vector);
    const declared = Number(res.headers.get("content-length") ?? "0");
    if (declared > MAX_RAW_FOR_INLINE) {
      // Record the source size (for the migration report) but skip the download.
      rawVectorBytes = declared;
      await res.body?.cancel();
    } else {
      const raw = await res.text();
      rawVectorBytes = Buffer.byteLength(raw);
      if (rawVectorBytes <= MAX_RAW_FOR_INLINE) {
        const optimized = optimizeSvg(raw, slug);
        const optimizedBytes = Buffer.byteLength(optimized.svg);
        if (optimizedBytes <= INLINE_BUDGET) {
          await writeFile(vectorPath, optimized.svg);
          delivery = "svg";
          inlineVectorBytes = optimizedBytes;
          aspectRatio = optimized.aspectRatio;
        }
      }
    }
  } catch (err) {
    // A missing/broken vector is fine — we still have the PNG.
    console.warn(`  ! vector skipped for ${slug}: ${(err as Error).message}`);
  }

  return {
    slug,
    name: entry.name,
    version: entry.version,
    imageType: entry.imageType,
    usageType: entry.usageType,
    team: entry.team,
    caption: entry.caption,
    tags: entry.tags,
    pathTags: entry.pathTags,
    colors: entry.colors,
    hedgehogs: entry.hedgehogs,
    verified: entry.verified,
    delivery,
    aspectRatio: Math.round(aspectRatio * 10000) / 10000,
    files: entry.files,
    rawVectorBytes,
    inlineVectorBytes,
    pngBytes: pngBytes.byteLength,
  };
}

async function main(): Promise<void> {
  const checkOnly = process.argv.includes("--check");

  await mkdir(VECTORS, { recursive: true });
  await mkdir(PNGS, { recursive: true });

  const [index, tags] = await Promise.all([
    fetchJson<SearchIndex>(INDEX_URL),
    fetchJson<TagsIndex>(TAGS_URL),
  ]);

  const upstream = [...index.assets].sort((a, b) => a.slug.localeCompare(b.slug));
  const prevCatalog = await readExistingCatalog();
  const prevState = await readSyncState();

  const summary: SyncSummary = {
    added: [],
    updated: [],
    removed: [],
    unchanged: 0,
    svgCount: 0,
    pngCount: 0,
  };

  const upstreamSlugs = new Set(upstream.map((e) => e.slug));
  for (const slug of prevCatalog.keys()) {
    if (!upstreamSlugs.has(slug)) summary.removed.push(slug);
  }

  // Decide per-asset work.
  const toProcess: IndexEntry[] = [];
  const reused = new Map<string, CatalogEntry>();
  for (const entry of upstream) {
    const hash = hashEntry(entry);
    const prior = prevState.entries[entry.slug];
    const prevEntry = prevCatalog.get(entry.slug);
    const filesPresent =
      prevEntry != null &&
      existsSync(join(PNGS, `${entry.slug}.png`)) &&
      (prevEntry.delivery !== "svg" || existsSync(join(VECTORS, `${entry.slug}.svg`)));
    if (prior?.indexHash === hash && filesPresent && prevEntry) {
      reused.set(entry.slug, prevEntry);
      summary.unchanged++;
    } else {
      toProcess.push(entry);
      if (prevEntry) summary.updated.push(entry.slug);
      else summary.added.push(entry.slug);
    }
  }

  if (checkOnly) {
    const drift = summary.added.length + summary.updated.length + summary.removed.length;
    console.log(JSON.stringify({ ...summary, drift }, null, 2));
    process.exit(drift > 0 ? 1 : 0);
  }

  // Process changed assets with bounded concurrency.
  const limit = pLimit(CONCURRENCY);
  const processed = await Promise.all(
    toProcess.map((entry) =>
      limit(async () => {
        const result = await processAsset(entry);
        console.log(`  ${result.delivery === "svg" ? "SVG" : "PNG"}  ${entry.slug}`);
        return result;
      }),
    ),
  );

  // Remove dropped assets' files.
  for (const slug of summary.removed) {
    await rm(join(VECTORS, `${slug}.svg`), { force: true });
    await rm(join(PNGS, `${slug}.png`), { force: true });
  }

  // Merge reused + freshly processed, sorted by slug.
  const entries: CatalogEntry[] = [...reused.values(), ...processed].sort((a, b) =>
    a.slug.localeCompare(b.slug),
  );
  summary.svgCount = entries.filter((e) => e.delivery === "svg").length;
  summary.pngCount = entries.length - summary.svgCount;

  const catalog: Catalog = {
    generatedAt: index.generatedAt,
    source: index.generatedAt,
    entries,
  };
  const state: SyncState = {
    source: index.generatedAt,
    entries: Object.fromEntries(
      upstream.map((e) => [
        e.slug,
        { indexHash: hashEntry(e), delivery: catalogDelivery(entries, e.slug) },
      ]),
    ),
  };

  await writeFile(join(ASSETS, "catalog.json"), `${JSON.stringify(catalog, null, 2)}\n`);
  await writeFile(join(ASSETS, "tags.json"), `${JSON.stringify(tags, null, 2)}\n`);
  await writeFile(join(ASSETS, "sync-state.json"), `${JSON.stringify(state, null, 2)}\n`);

  console.log(`\nSync summary:\n${JSON.stringify(summary, null, 2)}`);
}

function catalogDelivery(entries: CatalogEntry[], slug: string): "svg" | "png" {
  return entries.find((e) => e.slug === slug)?.delivery ?? "png";
}

await main();
