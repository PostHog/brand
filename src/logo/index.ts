// @posthog/brand/logo — the PostHog logo as one generic, parametric component.
//
// Unlike the illustration namespaces, the logo is not Figma-synced or codegen'd: it's a
// small, stable mark whose geometry is inlined here. One <Logo> covers every lockup and
// color treatment, so it can replace bespoke logo components anywhere.
//
//   import { Logo } from "@posthog/brand/logo";
//
//   <Logo />                                  // landscape lockup, full gradient (defaults)
//   <Logo variant="mono" color="#fff" />      // single color
//   <Logo variant="mono" />                   // inherits the ambient CSS `color`
//   <Logo variant="print" layout="stacked" /> // 4-color / CMYK, portrait lockup
//   <Logo.Logomark />                          // the hedgehog icon only
//   <Logo.Wordmark variant="mono" />           // the "PostHog" wordmark only
//   <Logo.Logomark jumpOnClick />              // the logomark, but it jumps when clicked
//
// Every form also takes `size`, `title` (accessible label), `className`, `style`, … .

export { Logo } from "./logo.tsx"
export type { LogoComponent } from "./logo.tsx"
export type {
  LogoProps,
  LogomarkProps,
  WordmarkProps,
  LogoVariant,
  LogoLayout,
} from "./types.ts"
