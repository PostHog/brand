// @posthog/brand/colors — the brand palette as typed tokens. React-free, tiny.
//
//   import { colors, colorCssVariable } from "@posthog/brand/colors";
//   colors.blue.core; // "#1490E8"
//   colorCssVariable("blue", "lighter"); // "--posthog-blue-lighter" (see ./colors/css)

export { colors } from "./generated/colors/tokens.ts"
export { colorCssVariable, type ColorTone } from "./color-variables.ts"
export type { BrandColor, BrandColors } from "./types.ts"
