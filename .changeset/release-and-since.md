---
"@posthog/brand": minor
---

Every asset's `AssetMeta` now records when it first shipped, as `since: { version, date }` (`getAsset("hoggies", "marathon")?.since` → `{ version: "0.13.1", date: "2026-10-13" }`), and the root export adds `release`, this package's own version and release date. Both come from a release ledger (`assets/releases.json`) that the Release workflow stamps on every bump; history before it was backfilled from the published releases.
