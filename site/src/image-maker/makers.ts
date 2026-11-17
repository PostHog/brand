// The image makers: one entry per format, shared by the home page (/tools/images) and each maker's
// page (/tools/images/<slug>). Each maker is a React component under `image-maker/makers/<engine>/`
// (its document in model.ts, its drawing in draw.ts) built on the shared editor in `editor/`; it
// loads only on its own page.

import { type ComponentType, type LazyExoticComponent, lazy } from "react"
import blogPreview from "../assets/image-makers/blog.webp"
import buildPreview from "../assets/image-makers/build-mode.webp"
import customerPreview from "../assets/image-makers/customer-story.webp"
import eventPreview from "../assets/image-makers/event.webp"

export interface Maker {
  /** URL segment under /tools/images, and the localStorage namespace. */
  slug: string
  /** Its folder under image-maker/makers/, and the CSS scope class (`mk-<engine>`). */
  engine: "blog" | "event" | "build" | "customer"
  name: string
  description: string
  sizes: string[]
  preview: string
  previewAlt: string
  /** Square previews sit inside the 16:9 card frame. */
  square?: boolean
  Component: LazyExoticComponent<ComponentType>
}

export const MAKERS: Maker[] = [
  {
    slug: "blog",
    engine: "blog",
    name: "Blog images",
    description:
      "Post and newsletter headers: a title with a highlighted phrase, the authors, and a hoggie matched to the title. Includes the SEO / AEO set.",
    sizes: ["1920 × 1080", "2×"],
    preview: blogPreview,
    previewAlt:
      "Example blog header: “The hidden cost of running your own analytics” with the Burning Money hoggie",
    Component: lazy(() => import("./makers/blog/BlogMaker.tsx")),
  },
  {
    slug: "events",
    engine: "event",
    name: "Event images",
    description:
      "Square event posts: a headline with bold words, calendar tile, time, location, partner logos, and a hoggie or your own picture.",
    sizes: ["1080 × 1080", "2×"],
    preview: eventPreview,
    previewAlt:
      "Example event image: PostHog hog meetup in London with a calendar tile for December 3 and the Party hoggie",
    square: true,
    Component: lazy(() => import("./makers/event/EventMaker.tsx")),
  },
  {
    slug: "build-mode",
    engine: "build",
    name: "Build mode images",
    description:
      "Build mode art on the blueprint grid, made once and exported for every channel, with tweaks per size.",
    sizes: ["LinkedIn 1920 × 1080", "Website", "X 1500 × 600", "Substack 1200 × 630"],
    preview: buildPreview,
    previewAlt:
      "Example build mode image: “The end of engineers?” on a blueprint grid with a robot and the author",
    Component: lazy(() => import("./makers/build/BuildMaker.tsx")),
  },
  {
    slug: "customer-stories",
    engine: "customer",
    name: "Customer story images",
    description:
      "Customer story headers: find the logo from posthog.com/customers or upload one, then pick a hoggie and colors.",
    sizes: ["1920 × 1080", "2×"],
    preview: customerPreview,
    previewAlt:
      "Example customer story image: the Supabase logo on green with two hoggies shaking hands",
    Component: lazy(() => import("./makers/customer/CustomerMaker.tsx")),
  },
]

export function makerBySlug(slug: string | undefined): Maker | undefined {
  return MAKERS.find((m) => m.slug === slug)
}
