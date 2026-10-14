import posthog from "posthog-js"
import { useEffect } from "react"

/**
 * Captures `assets searched` once a catalog search has settled — a second after the last
 * keystroke — so a query is one event rather than one per character. Searches that found
 * nothing are the interesting ones: they're the assets people expected and we don't have.
 */
export function useSearchTracking(
  assetType: "hoggie" | "crest",
  query: string,
  resultCount: number,
): void {
  useEffect(() => {
    const q = query.trim()
    if (!q) return
    const timer = setTimeout(() => {
      posthog.capture("assets searched", {
        asset_type: assetType,
        query: q,
        results_count: resultCount,
      })
    }, 1000)
    return () => clearTimeout(timer)
  }, [assetType, query, resultCount])
}
