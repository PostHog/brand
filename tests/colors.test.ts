import { describe, expect, it } from "vitest"
import { colorCssVariable, colors } from "../src/colors.ts"
import { colorsCss } from "../src/colors-css.ts"

describe("colorCssVariable", () => {
  it("names each tone's custom property", () => {
    expect(colorCssVariable("blue")).toBe("--posthog-blue")
    expect(colorCssVariable("corn-blue", "lighter")).toBe("--posthog-corn-blue-lighter")
    expect(colorCssVariable("blue", "gradient")).toBe("--posthog-blue-gradient")
  })

  it("matches every property colorsCss defines", () => {
    for (const [slug, color] of Object.entries(colors)) {
      expect(colorsCss).toContain(`${colorCssVariable(slug)}: ${color.core};`)
      expect(colorsCss).toContain(`${colorCssVariable(slug, "lighter")}: ${color.lighter};`)
      expect(colorsCss).toContain(`${colorCssVariable(slug, "darker")}: ${color.darker};`)
      expect(colorsCss).toContain(`${colorCssVariable(slug, "gradient")}: linear-gradient(`)
    }
  })
})
