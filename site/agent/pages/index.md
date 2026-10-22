# PostHog Brand

> {{description}}

HTML version: {{site}}/ · All docs for agents: {{site}}/llms.txt

This site is the home of PostHog's brand assets: {{logoCount}} logo files, the RoundHog typeface, {{colorCount}} brand colors, {{hoggieCount}} hedgehog illustrations ("hoggies") and {{crestCount}} team crests. It is built from `@posthog/brand` v{{version}}, released {{released}}.

{{twoWays}}

## Sections

{{sections}}

## For agents

- [llms.txt]({{site}}/llms.txt): this index, with every asset listed. [llms-full.txt]({{site}}/llms-full.txt): the markdown of all pages in one file.
- [catalog.json]({{site}}/catalog.json): every logo, hoggie, crest, color and font face, with its file URLs, PNG size, JSX and package import.
- Every HTML page has a markdown twin: add `.md` to its URL (`/hoggies/chart` → `/hoggies/chart.md`; the home page is `/index.md`).
- [colors.json]({{site}}/colors.json) and [colors.css]({{site}}/colors.css): the palette as data and as CSS custom properties. [fonts/roundhog.css]({{site}}/fonts/roundhog.css): RoundHog's `@font-face` rules.

### WebMCP

In a browser with WebMCP (`document.modelContext`), this site registers these tools:

{{tools}}

{{license}}
