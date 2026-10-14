// The CSS custom-property names of the brand palette. Kept free of the generated tokens so
// codegen can use it to write `colorsCss` — the names it emits and the ones this returns are
// one function, not two copies of a naming rule.

/** A color's tones, as `colorsCss` exposes them. */
export type ColorTone = "core" | "lighter" | "darker" | "gradient"

/**
 * The CSS custom property `colorsCss` (`@posthog/brand/colors/css`) defines for a color tone:
 * `colorCssVariable("blue")` → `"--posthog-blue"`, `colorCssVariable("corn-blue", "lighter")`
 * → `"--posthog-corn-blue-lighter"`. The `gradient` one holds a whole `linear-gradient(…)`.
 */
export function colorCssVariable(slug: string, tone: ColorTone = "core"): string {
  return tone === "core" ? `--posthog-${slug}` : `--posthog-${slug}-${tone}`
}
