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

describe("<Logo.Logomark>", () => {
  const renderMark = (props?: Record<string, unknown>): string =>
    renderToStaticMarkup(createElement(Logo.Logomark, props))

  it("renders the logomark as 4 animatable parts, head last", () => {
    const html = renderMark()
    expect(html).toContain('viewBox="0 0 52 28"')
    const parts = [...html.matchAll(/data-logo-part="([a-z]+)"/g)].map((m) => m[1])
    expect(parts).toEqual(["blue", "red", "yellow", "head"])
  })

  it("supports every logomark variant", () => {
    expect(renderMark()).toContain("<linearGradient") // gradient is the default
    expect(renderMark({ variant: "print" })).toContain("#0054ff")

    const monoHtml = renderMark({ variant: "mono", color: "#fff" })
    expect(monoHtml).toContain("currentColor")
    expect(monoHtml).not.toContain("#111")
    expect(monoHtml).toContain("color:#fff")
  })

  it("is static by default — no jump affordances", () => {
    const html = renderMark()
    expect(html).not.toContain("cursor:pointer")
    expect(html).not.toContain("overflow:visible") // clips to its box like a plain icon
  })

  it("opts into jumping via jumpOnClick / autoJumpMs", () => {
    // Click-to-jump is pointer-cursored and lets the parts escape the viewBox mid-jump.
    const clicky = renderMark({ jumpOnClick: true })
    expect(clicky).toContain("cursor:pointer")
    expect(clicky).toContain("overflow:visible")

    // Auto-jumping needs the overflow too, but isn't clickable — so no pointer cursor.
    const auto = renderMark({ autoJumpMs: 3000 })
    expect(auto).toContain("overflow:visible")
    expect(auto).not.toContain("cursor:pointer")
  })

  it("maps `size` to width and stays accessible", () => {
    expect(renderMark({ size: 64 })).toContain('width="64"')
    expect(renderMark({ title: "PostHog" })).toContain("<title>PostHog</title>")
    expect(renderMark()).toContain('aria-hidden="true"')
  })

  it.each([
    ["christmas", "#FF474D"], // the Santa hat stays red
    ["halloween", "#8927AF"], // the witch hat stays purple
  ] as const)("wears the %s accessory on the head, unclipped", (holiday, _hatColor) => {
    const html = renderMark({ holiday })
    expect(html).toContain(`data-logo-accessory="${holiday}"`)
    const headGroup = html.slice(html.indexOf('data-logo-part="head"'))
    expect(headGroup).toContain("data-logo-accessory") // the hat rides the head group
    expect(html).toContain("overflow:visible") // ...and pokes past the silhouette, so no clip
  })

  it.each([
    ["christmas", "#FF474D"],
    ["halloween", "#8927AF"],
  ] as const)("keeps the %s accessory's festive colors even in mono", (holiday, hatColor) => {
    const html = renderMark({ holiday, variant: "mono", color: "#fff" })
    expect(html).toContain("currentColor") // the mark itself is recolored
    expect(html).toContain(hatColor) // ...but the accessory keeps its own color
    expect(html).toContain("color:#fff")
  })
})
