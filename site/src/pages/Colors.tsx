import { colors } from "@posthog/brand/colors"
import { ColorCard } from "../components/ColorCard.tsx"
import { PageHeader } from "../components/PageHeader.tsx"
import { useSeo } from "../useSeo.ts"

const ENTRIES = Object.entries(colors).sort(([, a], [, b]) => a.name.localeCompare(b.name))

export function ColorsPage() {
  useSeo("/colors")

  return (
    <div>
      <PageHeader eyebrow="@posthog/brand/colors" title="Colors">
        {ENTRIES.length} brand colors, each with a <code>core</code>, <code>lighter</code>, and{" "}
        <code>darker</code> tone plus a gradient. Click any value to copy its hex. The same tokens
        ship as CSS custom properties via <code>@posthog/brand/colors/css</code> — and theme this
        very site.
      </PageHeader>

      <div className="grid grid-colors">
        {ENTRIES.map(([slug, color]) => (
          <ColorCard key={slug} slug={slug} color={color} />
        ))}
      </div>
    </div>
  )
}
