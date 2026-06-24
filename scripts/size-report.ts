// Prints a Markdown size report across all namespaces. CI appends it to $GITHUB_STEP_SUMMARY.

import { readFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import type { Catalog } from "./lib/catalog.ts"
import { NAMESPACES } from "../src/types.ts"

const ASSETS = join(dirname(fileURLToPath(import.meta.url)), "..", "assets")

function mib(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const rows: string[] = []
let totalAssets = 0
let totalSvg = 0
let totalPng = 0

for (const ns of NAMESPACES) {
  const path = join(ASSETS, ns, "catalog.json")
  if (!existsSync(path)) continue
  const catalog = JSON.parse(await readFile(path, "utf8")) as Catalog
  const svg = catalog.entries.reduce((n, e) => n + e.svgBytes, 0)
  const png = catalog.entries.reduce((n, e) => n + e.pngBytes, 0)
  rows.push(`| \`${ns}\` | ${catalog.entries.length} | ${mib(svg)} | ${mib(png)} |`)
  totalAssets += catalog.entries.length
  totalSvg += svg
  totalPng += png
}

const lines = [
  "## 🎨 PostHog brand assets",
  "",
  "| Namespace | Assets | SVG | PNG |",
  "| --- | --- | --- | --- |",
  ...rows,
  `| **Total** | **${totalAssets}** | **${mib(totalSvg)}** | **${mib(totalPng)}** |`,
]

console.log(lines.join("\n"))
