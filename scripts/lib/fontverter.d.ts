declare module "fontverter" {
  type FontFormat = "sfnt" | "woff" | "woff2"
  const fontverter: {
    convert(font: Buffer, toFormat: FontFormat): Promise<Buffer>
  }
  export default fontverter
}
