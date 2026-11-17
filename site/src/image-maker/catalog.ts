// The image makers, as data: one entry per maker. Everything that lists the makers reads this
// table — the home page cards and routes (makers.ts), the page metadata and prerendered pages
// (seo.ts), and the agent docs' list of makers (agent/markdown.ts). It's plain data with no React
// or asset imports, so the build (which runs in Node) can read it too.
//
// Adding a maker? See "Adding an image maker" in CLAUDE.md.

export interface MakerEntry {
  /** URL segment under /tools/images, and the localStorage namespace. */
  slug: string
  /** Its folder under image-maker/makers/, and the CSS scope class (`mk-<engine>`). */
  engine: string
  /** The card title, nav label and breadcrumb ("Blog images"). */
  name: string
  /** The home page card's description. */
  description: string
  /** The size chips on the card. */
  sizes: string[]
  previewAlt: string
  /** Square previews sit inside the 16:9 card frame. */
  square?: boolean
  /** The maker page's `<title>`, heading and meta description (seo.ts). */
  seo: { title: string; headline: string; description: string }
  /** Its line in the agent docs' list of makers (`/tools/images.md`), after the link. */
  agentSummary: string
}

export const MAKER_CATALOG = [
  {
    slug: "blog",
    engine: "blog",
    name: "Blog images",
    description:
      "Post and newsletter headers: a title with a highlighted phrase, the authors, and a hoggie matched to the title. Includes the SEO / AEO set.",
    sizes: ["1920 × 1080", "2×"],
    previewAlt:
      "Example blog header: “The hidden cost of running your own analytics” with the Burning Money hoggie",
    seo: {
      title: "PostHog blog image maker",
      headline: "Make a PostHog blog image",
      description:
        "Make a 1920 × 1080 PostHog blog header: a title with a highlighted phrase, the authors, and a hoggie matched to the title. Download it as a PNG.",
    },
    agentSummary:
      "1920 × 1080 post and newsletter headers, with a highlighted phrase, up to 3 authors and a hoggie matched to the title.",
  },
  {
    slug: "events",
    engine: "event",
    name: "Event images",
    description:
      "Square event posts: a headline with bold words, calendar tile, time, location, partner logos, and a hoggie or your own picture.",
    sizes: ["1080 × 1080", "2×"],
    previewAlt:
      "Example event image: PostHog hog meetup in London with a calendar tile for December 3 and the Party hoggie",
    square: true,
    seo: {
      title: "PostHog event image maker",
      headline: "Make a PostHog event image",
      description:
        "Make a 1080 × 1080 PostHog event post with a headline, calendar tile, time, location, partner logos and a hoggie. Download it as a PNG.",
    },
    agentSummary:
      "1080 × 1080 event posts with a calendar tile, time, location, partner logos and a hoggie or your own picture.",
  },
  {
    slug: "build-mode",
    engine: "build",
    name: "Build mode images",
    description:
      "Build mode art on the blueprint grid, made once and exported for every channel, with tweaks per size.",
    sizes: ["LinkedIn 1920 × 1080", "Website", "X 1500 × 600", "Substack 1200 × 630"],
    previewAlt:
      "Example build mode image: “The end of engineers?” on a blueprint grid with a robot and the author",
    seo: {
      title: "PostHog build mode image maker",
      headline: "Make a build mode image",
      description:
        "Make build mode art on the blueprint grid once and download it for LinkedIn, the website, X and Substack.",
    },
    agentSummary: "build mode art on the blueprint grid for LinkedIn, the website, X and Substack.",
  },
  {
    slug: "customer-stories",
    engine: "customer",
    name: "Customer story images",
    description:
      "Customer story headers: find the logo from posthog.com/customers or upload one, then pick a hoggie and colors.",
    sizes: ["1920 × 1080", "2×"],
    previewAlt:
      "Example customer story image: the Supabase logo on green with two hoggies shaking hands",
    seo: {
      title: "PostHog customer story image maker",
      headline: "Make a PostHog customer story image",
      description:
        "Make a 1920 × 1080 customer story header with the company's logo from posthog.com/customers, a hoggie and brand colors. Download it as a PNG.",
    },
    agentSummary:
      "1920 × 1080 customer story headers with the company's logo from posthog.com/customers.",
  },
] as const satisfies readonly MakerEntry[]

export type MakerSlug = (typeof MAKER_CATALOG)[number]["slug"]

export const MAKERS_PATH = "/tools/images"

export function makerPath(slug: string): string {
  return `${MAKERS_PATH}/${slug}`
}
