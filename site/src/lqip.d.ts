// Virtual modules served by `brandLqip()` (see site/lqip-plugin.ts): a map from each
// PNG export name to a tiny blurred WebP data URI, one module per export group.
declare module "virtual:brand-lqip/hoggies" {
  const map: Record<string, string>
  export default map
}
declare module "virtual:brand-lqip/crests-full" {
  const map: Record<string, string>
  export default map
}
declare module "virtual:brand-lqip/crests-mini" {
  const map: Record<string, string>
  export default map
}

// Virtual modules served by `brandSvg()` (see site/svg-plugin.ts): a map from each leaf
// module slug to a loader that lazily imports that asset's SVG string.
declare module "virtual:brand-svg/hoggies" {
  const map: Record<string, () => Promise<string>>
  export default map
}
declare module "virtual:brand-svg/crests-full" {
  const map: Record<string, () => Promise<string>>
  export default map
}
declare module "virtual:brand-svg/crests-mini" {
  const map: Record<string, () => Promise<string>>
  export default map
}
