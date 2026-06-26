// Framework-agnostic types. Deliberately free of any React import so that the
// `/metadata`, `/svg` (string), and `/colors` entry points work with zero React present.

/** The asset families sourced from the brand-book Figma file, each its own export namespace. */
export type Namespace = "hoggies" | "crests"

/** Every namespace, in a stable order. */
export const NAMESPACES: readonly Namespace[] = ["hoggies", "crests"]

/**
 * Crests come in two size tiers: the full-detail illustration (`full`) and the
 * simplified badge (`mini`). Each tier is its own export subpath (`crests/full`,
 * `crests/mini`) and its own on-disk folder under `assets/crests/<tier>/`.
 */
export type CrestTier = "full" | "mini"

/** Every crest tier, in a stable order. */
export const CREST_TIERS: readonly CrestTier[] = ["full", "mini"]

/**
 * Metadata for a single illustration asset. Carried on each component as `.meta`.
 * Every asset ships as BOTH an inline SVG and a bundled PNG, so there is no
 * per-asset delivery field.
 */
export interface AssetMeta {
  /**
   * Unique within its namespace — or, for crests, within its (namespace, tier).
   * E.g. "doctor-hog", "landscape-color-gradient", "array".
   */
  slug: string
  /** Friendly display name derived from the Figma node, e.g. "Doctor Hog". */
  name: string
  /** Which family this asset belongs to. */
  namespace: Namespace
  /** Crest size tier. Set only on `crests` assets; absent elsewhere. */
  tier?: CrestTier
  /** The Figma node id this asset was rendered from, e.g. "63:161728". */
  figmaNodeId: string
  /** Intrinsic aspect ratio (width / height) of the bundled image. */
  aspectRatio: number
  /** Figma COMPONENT_SET variant properties (e.g. `{ Orientation: "Landscape" }`), when any. */
  variant?: Record<string, string>
  /**
   * Free-form search tags, parsed from the component's Figma description (a
   * comma-separated list). Trimmed and de-duplicated, in author order. Omitted when the
   * component has none. Folded into `findAssets`' free-text search and the `tags` filter.
   */
  tags?: string[]
}

/**
 * An export group: the unit that produces one set of generated modules and one
 * family of subpath exports (`@posthog/brand/<path>`, `/<path>/svg`, `/<path>/png`,
 * `/<path>/metadata`). Most namespaces are a single group whose path equals the
 * namespace; `crests` fans out into two groups, one per tier.
 */
export interface AssetGroup {
  /** Export subpath and generated directory, e.g. "hoggies", "crests/full". */
  path: string
  /** The public family this group belongs to. */
  namespace: Namespace
  /** The crest tier this group renders, when it is a tier of `crests`. */
  tier?: CrestTier
}

/** Every export group, in a stable order. The codegen and exports iterate this. */
export const ASSET_GROUPS: readonly AssetGroup[] = [
  { path: "hoggies", namespace: "hoggies" },
  { path: "crests/full", namespace: "crests", tier: "full" },
  { path: "crests/mini", namespace: "crests", tier: "mini" },
]

/** A single brand color and its tonal ramp. Hex strings include the leading `#`. */
export interface BrandColor {
  /** Human name, e.g. "blue", "corn blue". */
  name: string
  /** The primary/core swatch. */
  core: string
  /** A lighter tint. */
  lighter: string
  /** A darker shade. */
  darker: string
  /** The brand gradient stops for this color, `[from, to]`. */
  gradient: [string, string]
}

/** All brand colors keyed by slug (e.g. `blue`, `corn-blue`). */
export type BrandColors = Record<string, BrandColor>
