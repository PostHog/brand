// Declarative map of brand-book Figma pages -> library namespaces.
// `sync.ts` walks these; changing the source means editing this file, not the pipeline.

import type { Namespace } from "../../src/types.ts"

/** The brand-book file. Override with FIGMA_FILE_KEY for a fork/sandbox. */
export const FIGMA_FILE_KEY: string = process.env.FIGMA_FILE_KEY ?? "EqKxlSFoOCkRXCnHi4C3eE"

export interface IllustrationPage {
  namespace: Namespace
  /** Container node whose descendants are scanned for COMPONENT / COMPONENT_SET. */
  containerId: string
  /** Stripped from the front of a node/set name before slugifying (e.g. "hog / "). */
  stripPrefix?: RegExp
  /**
   * Per-COMPONENT_SET slug prefix, keyed by the set's node id. Used for logos where
   * the set name ("PostHog Logos") is noise but "Primative/Wordmark" should yield a
   * "wordmark-" prefix. Sets not listed here fall back to their slugified name.
   */
  setPrefixes?: Record<string, string>
  /**
   * Name of the COMPONENT_SET variant property that selects a crest size tier
   * (its values being "Default" → full and "Mini" → mini). When set, that property
   * is lifted out of the slug into `AssetMeta.tier` instead of being appended to it.
   */
  tierVariantProp?: string
  /** PNG render scale (multiplier of the node's intrinsic size). */
  pngScale: number
}

export const ILLUSTRATION_PAGES: IllustrationPage[] = [
  {
    namespace: "hoggies",
    containerId: "35:77995", // frame "hoggies components"
    stripPrefix: /^hog\s*\/\s*/i,
    pngScale: 1, // nodes are 1000x1000
  },
  {
    namespace: "crests",
    containerId: "23:6", // frame "team crests component"
    tierVariantProp: "Property 1", // "Default" → full, "Mini" → mini
    pngScale: 1, // Default 600x600, Mini 115x115
  },
]
