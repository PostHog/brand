import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { Logo } from "../src/logo/index.ts"

const render = (props?: Record<string, unknown>): string =>
  renderToStaticMarkup(createElement(Logo, props))

describe("<Logo>", () => {
  it("defaults to the landscape gradient lockup", () => {
    const html = render()
    expect(html).toContain("<svg")
    expect(html).toContain('viewBox="0 0 160 28"')
    expect(html).toContain("<linearGradient") // the full gradient artwork
  })

  it.each([
    ["landscape", "0 0 160 28"],
    ["stacked", "0 0 96 86"],
    ["logomark", "0 0 52 28"],
    ["wordmark", "0 0 97 24"],
  ])("renders the %s viewBox", (layout, viewBox) => {
    expect(render({ layout })).toContain(`viewBox="${viewBox}"`)
  })

  it("draws mono with currentColor and applies an explicit color", () => {
    const mono = render({ variant: "mono" })
    expect(mono).toContain("currentColor")
    expect(mono).not.toContain("#111") // every black fill was recolored
    expect(mono).not.toContain("<linearGradient")

    expect(render({ variant: "mono", color: "#fff" })).toContain("color:#fff")
  })

  it("renders the 4-color print artwork", () => {
    const html = render({ variant: "print" })
    expect(html).toContain("#0054ff") // a print separation color
    expect(html).not.toContain("<linearGradient")
  })

  it("ignores color for gradient/print (no inline color style)", () => {
    expect(render({ variant: "gradient", color: "#fff" })).not.toContain("color:#fff")
  })

  it("exposes Logomark and Wordmark shorthands", () => {
    const logomark = renderToStaticMarkup(createElement(Logo.Logomark))
    expect(logomark).toContain('viewBox="0 0 52 28"')

    const wordmark = renderToStaticMarkup(createElement(Logo.Wordmark))
    expect(wordmark).toContain('viewBox="0 0 97 24"')
    expect(wordmark).toContain("currentColor") // the wordmark is always mono
  })

  it("maps `size` to width", () => {
    expect(render({ size: 120 })).toContain('width="120"')
  })

  it("is accessible when titled and decorative otherwise", () => {
    const titled = render({ title: "PostHog" })
    expect(titled).toContain('role="img"')
    expect(titled).toContain("<title>PostHog</title>")

    expect(render()).toContain('aria-hidden="true"')
  })
})
