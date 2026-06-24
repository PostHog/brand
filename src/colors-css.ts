// @posthog/brand/colors/css — the brand palette as a CSS custom-properties string.
//
//   import { colorsCss } from "@posthog/brand/colors/css";
//   const style = document.createElement("style");
//   style.textContent = colorsCss; // :root { --posthog-blue: #1490E8; … }
//   document.head.appendChild(style);

export { colorsCss } from "./generated/colors/css.ts"
