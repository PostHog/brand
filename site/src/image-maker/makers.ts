// The image makers the site serves: each entry in catalog.ts plus its preview image and its
// component. Each maker is a React component under `image-maker/makers/<engine>/` (its document
// in model.ts, its drawing in draw.ts) built on the shared editor in `editor/`; it loads only on
// its own page.

import { type ComponentType, type LazyExoticComponent, lazy } from "react"
import blogPreview from "../assets/image-makers/blog.webp"
import buildPreview from "../assets/image-makers/build-mode.webp"
import customerPreview from "../assets/image-makers/customer-story.webp"
import eventPreview from "../assets/image-makers/event.webp"
import { MAKER_CATALOG, type MakerEntry, type MakerSlug } from "./catalog.ts"

// Keyed by slug and typed as complete, so a maker added to the catalog without its preview or
// component fails the typecheck.
const PREVIEWS: Record<MakerSlug, string> = {
  blog: blogPreview,
  events: eventPreview,
  "build-mode": buildPreview,
  "customer-stories": customerPreview,
}

const COMPONENTS: Record<MakerSlug, LazyExoticComponent<ComponentType>> = {
  blog: lazy(() => import("./makers/blog/BlogMaker.tsx")),
  events: lazy(() => import("./makers/event/EventMaker.tsx")),
  "build-mode": lazy(() => import("./makers/build/BuildMaker.tsx")),
  "customer-stories": lazy(() => import("./makers/customer/CustomerMaker.tsx")),
}

export interface Maker extends MakerEntry {
  preview: string
  Component: LazyExoticComponent<ComponentType>
}

export const MAKERS: Maker[] = MAKER_CATALOG.map((entry) => ({
  ...entry,
  sizes: [...entry.sizes],
  preview: PREVIEWS[entry.slug],
  Component: COMPONENTS[entry.slug],
}))

export function makerBySlug(slug: string | undefined): Maker | undefined {
  return MAKERS.find((m) => m.slug === slug)
}
