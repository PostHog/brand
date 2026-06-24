// Manual slug/name overrides for assets whose Figma-derived identifiers read poorly
// (e.g. "dadd-ai-l" / "dadd-ai-r" instead of "…-left" / "…-right").
//
// Renames are applied by codegen (`scripts/codegen.ts`) as it turns the raw Figma mirror
// in `assets/` into the published modules in `src/generated/`. They are a presentation
// layer over that mirror: the committed `assets/<ns>/…` files keep the faithful Figma
// slug — so `sync` stays a clean, incremental mirror and never has to reconcile a
// hand-edit — while every generated component, export identifier, deep-import path, and
// `AssetMeta` reflects the nicer name.
//
// Keyed by namespace, then by the *original* slug (what `sync` wrote to
// `assets/<ns>/catalog.json`). A rule may set a new `slug`, a new display `name`, or
// both. Applying or changing a rename is offline (`pnpm codegen`); because it changes the
// public API it should ship with its own changeset.

import type { Namespace } from "../../src/types.ts"

export interface RenameRule {
  /**
   * New slug. Drives on-disk module filenames, component + export identifiers, the
   * `@posthog/brand/<ns>/{svg,png}/<slug>` deep-import paths, and `AssetMeta.slug`.
   */
  slug?: string
  /** New display name (`AssetMeta.name`). Defaults to Title Case of the (new) slug. */
  name?: string
}

/** `namespace -> original slug -> override`. */
export const RENAMES: Partial<Record<Namespace, Record<string, RenameRule>>> = {
  hoggies: {
    "dadd-ai-l": { slug: "dadd-ai-left", name: "Dadd AI Left" },
    "dadd-ai-r": { slug: "dadd-ai-right", name: "Dadd AI Right" },
  },
}

/** "foo-bar-baz" -> "Foo Bar Baz". Used to default a renamed asset's display name. */
export function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

/**
 * Resolve an asset's published slug + display name, applying any configured rename.
 * Returns the inputs unchanged when no rule matches. When a rule renames the slug but
 * omits a name, the name is derived from the new slug so identifiers and labels agree.
 */
export function applyRename(
  namespace: Namespace,
  slug: string,
  name: string,
): { slug: string; name: string } {
  const rule = RENAMES[namespace]?.[slug]
  if (!rule) return { slug, name }
  const renamedSlug = rule.slug ?? slug
  const renamedName = rule.name ?? (rule.slug ? titleFromSlug(renamedSlug) : name)
  return { slug: renamedSlug, name: renamedName }
}
