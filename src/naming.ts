// Name -> slug -> identifier helpers shared by sync, codegen, and tests.
//
// Component names carry the family word so that:
//   - digit-leading slugs (404, 9-9-6) still produce valid identifiers,
//   - generated names never collide with consumer code,
//   - the family word autocompletes a whole set.
// Hoggies prefix it (`HedgehogDoctorHog`); crests put it last (`ArrayCrest`, `ArrayCrestMini`)
// so the one name reads the same in every export — the tier-specific `crests/{full,mini}`
// barrels and the combined `crests` barrel.

import type { CrestTier, Namespace } from "./types.ts"

/** PascalCase prefix applied to most namespaces' identifiers. Crests use a suffix instead. */
export const NAMESPACE_PREFIX: Record<Namespace, string> = {
  hoggies: "Hedgehog",
  crests: "", // crests append "Crest" rather than prefixing — see componentName
}

/**
 * Turns a free-form Figma name into a URL/file-safe slug.
 * "Doctor Hog" -> "doctor-hog", "piñata hog" -> "pinata-hog",
 * "i'm the driver" -> "im-the-driver", "Color (gradient)" -> "color-gradient".
 */
export function slugify(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .replace(/['’`]/g, "") // drop apostrophes so "i'm" -> "im"
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/**
 * Slug segments rendered fully upper-cased in identifiers instead of Title-cased, so
 * acronyms read correctly: "ai-gateway" -> "AIGateway", not "AiGateway". Matched
 * case-insensitively against whole hyphen-delimited segments only (so "waiter" is
 * untouched). Because `slugToPascal` is shared by codegen and the runtime
 * `getComponentName`, adding a word here keeps the generated export and the runtime
 * lookup in agreement — this is the one place that controls identifier casing.
 */
export const ACRONYMS: ReadonlySet<string> = new Set(["ai", "na", "eu"])

/** "doctor-hog" -> "DoctorHog", "9-9-6" -> "996", "ai-gateway" -> "AIGateway". */
export function slugToPascal(slug: string): string {
  return slug
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) =>
      ACRONYMS.has(part.toLowerCase())
        ? part.toUpperCase()
        : part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join("")
}

/** Lower-cases the first character: "HedgehogDoctorHog" -> "hedgehogDoctorHog". */
function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1)
}

/**
 * ("hoggies", "doctor-hog") -> "HedgehogDoctorHog". Crests put "Crest" last, with minis
 * keeping a trailing "Mini" so
 * the full and mini variants of one crest (same slug) don't collide: ("crests", "array",
 * "full") -> "ArrayCrest", ("crests", "array", "mini") -> "ArrayCrestMini".
 */
export function componentName(namespace: Namespace, slug: string, tier?: CrestTier): string {
  const pascal = slugToPascal(slug)
  const tierSuffix = tier === "mini" ? "Mini" : ""
  if (namespace === "crests") return `${pascal}Crest${tierSuffix}`
  return `${NAMESPACE_PREFIX[namespace]}${pascal}${tierSuffix}`
}

/** ("hoggies", "doctor-hog") -> "hedgehogDoctorHogSvg"; ("crests","array","mini") -> "arrayCrestMiniSvg". */
export function svgConstName(namespace: Namespace, slug: string, tier?: CrestTier): string {
  return `${lowerFirst(componentName(namespace, slug, tier))}Svg`
}

/** ("hoggies", "doctor-hog") -> "hedgehogDoctorHogPng"; ("crests","array","mini") -> "arrayCrestMiniPng". */
export function pngConstName(namespace: Namespace, slug: string, tier?: CrestTier): string {
  return `${lowerFirst(componentName(namespace, slug, tier))}Png`
}

/**
 * Throws if two distinct slugs in the same namespace map to the same component
 * name. Codegen calls this before writing anything so an ambiguous slug fails
 * loudly instead of silently overwriting a module.
 */
export function assertNoCollisions(
  namespace: Namespace,
  slugs: readonly string[],
  tier?: CrestTier,
): void {
  const byName = new Map<string, string>()
  for (const slug of slugs) {
    const name = componentName(namespace, slug, tier)
    const existing = byName.get(name)
    if (existing !== undefined && existing !== slug) {
      throw new Error(
        `Component name collision in "${namespace}": "${existing}" and "${slug}" both map to ${name}.`,
      )
    }
    byName.set(name, slug)
  }
}

/**
 * Given a list of desired slugs (in a deterministic order), returns the same list
 * with duplicates disambiguated by a numeric suffix: the first wins its bare slug,
 * later collisions become `slug-2`, `slug-3`, … Keeps sync stable when the source
 * has two nodes with the same name (e.g. two "wizard hog"s).
 */
export function dedupeSlugs(slugs: readonly string[]): string[] {
  const seen = new Map<string, number>()
  return slugs.map((slug) => {
    const n = (seen.get(slug) ?? 0) + 1
    seen.set(slug, n)
    return n === 1 ? slug : `${slug}-${n}`
  })
}
