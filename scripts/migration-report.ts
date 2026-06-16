// Prints the SVG-vs-PNG migration status as Markdown to stdout.
// The weekly workflow captures this as a job output and step summary.
// Goal: every hedgehog ships as a true SVG. Until then, this tracks progress.

import { migrationStats, mib, readCatalog } from "./lib/stats.ts";

const version = process.env.npm_package_version ?? "unknown";
const stats = migrationStats(await readCatalog());

function progressBar(pct: number, width = 20): string {
  const filled = Math.round((pct / 100) * width);
  return `${"█".repeat(filled)}${"░".repeat(width - filled)}`;
}

const pending = stats.largestPending
  .map(
    (e) => `- \`${e.slug}\` — ${e.rawVectorBytes ? mib(e.rawVectorBytes) : "> 2 MB"} source vector`,
  )
  .join("\n");

const report = [
  `## 🦔 Hedgehog SVG migration — weekly status (v${version})`,
  ``,
  `**${stats.svg}** of **${stats.total}** hedgehogs ship as true SVGs (**${stats.svgPct}%**); ` +
    `the rest fall back to bundled PNGs.`,
  ``,
  `\`${progressBar(stats.svgPct)}\` ${stats.svgPct}%`,
  ``,
  `Bundled art: ${mib(stats.totalBytes)} (${mib(stats.svgBytes)} SVG + ${mib(stats.pngBytes)} PNG).`,
  ``,
  `### Biggest assets still awaiting SVG migration`,
  ``,
  pending,
  ``,
  `_Goal: 100% true SVGs. Re-trace these upstream in the art pipeline to migrate them._`,
].join("\n");

console.log(report);
