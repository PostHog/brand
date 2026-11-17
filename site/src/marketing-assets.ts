// The marketing assets from the brand book's "hero images" Figma page: one table shared by the
// Marketing assets page, the build (`seo-plugin.ts`, `agent/`), which lists them in the prerendered page,
// the sitemap, the markdown and llms.txt, and `scripts/fetch-marketing-assets.ts`, which renders each
// one from Figma into `site/public/marketing-assets/`. Plain data, so every one of those can import it.
//
// The files are committed, not built: they're designed raster art, rendered by Figma at full
// resolution, so a deploy can't re-make them. Re-run the fetch script after the design changes.

/** The Figma file (the PostHog Brand Book) the images are rendered from. */
export const MARKETING_FIGMA_FILE = "EqKxlSFoOCkRXCnHi4C3eE"

export interface MarketingAsset {
  /** File stem and stable id: `/marketing-assets/<id>.png`. */
  id: string
  /** Its headline, as the image reads. */
  name: string
  /** The frame in the Figma file it is rendered from. */
  figmaNode: string
  alt: string
}

export interface MarketingAssetGroup {
  id: "product-heroes" | "app-store"
  title: string
  /** What the group is for. */
  what: string
  /** How to use it. */
  how: readonly string[]
  /** Size of the frames in Figma, in px. */
  frame: { readonly width: number; readonly height: number }
  /** The render scale: the PNG is `frame × scale`. Matches the art inside, so nothing is upscaled. */
  scale: number
  /** Width of the page's preview, in px. */
  previewWidth: number
  images: readonly MarketingAsset[]
}

export const MARKETING_ASSET_GROUPS: readonly MarketingAssetGroup[] = [
  {
    id: "product-heroes",
    title: "Product heroes",
    what: "Hero images that pitch one thing PostHog does: the top of a landing page, a launch or blog post, a newsletter, or a social post. Each one is a panel on the garden scene with a headline, a short pitch, a product window and a card with the next step.",
    how: [
      "Use one where you're introducing what PostHog does, with the image as the first thing people see.",
      "The text is part of the image, so put the page's own heading in HTML near it rather than relying on the image.",
      "To make a new one, keep the same layout: a headline with one highlighted word, two or three short sentences, a real product window, then one card with the next step. Put product windows on the garden scene, never text on its own.",
    ],
    frame: { width: 1600, height: 1100 },
    // The garden art inside is drawn at about 2x the frame, so 2x is the full resolution.
    scale: 2,
    previewWidth: 1280,
    images: [
      {
        id: "context-layer",
        name: "Your product's context layer",
        figmaNode: "2591:3",
        alt: "“Your product's context layer”: the PostHog home screen beside a “Set up PostHog for free” card",
      },
      {
        id: "ask-posthog-anything",
        name: "Ask PostHog anything",
        figmaNode: "2635:2100",
        alt: "“Ask PostHog anything”: PostHog AI tracing a drop in paid conversions across Google Ads, PostHog, Stripe and GitHub",
      },
      {
        id: "agents-product-context",
        name: "Give agents product context",
        figmaNode: "2635:2538",
        alt: "“Give agents product context”: PostHog's products around “Your agents”, with the command to install the PostHog MCP",
      },
      {
        id: "ship-with-posthog",
        name: "Ship with PostHog",
        figmaNode: "2635:2777",
        alt: "“Ship with PostHog”: three prioritized fixes in the PostHog inbox, beside the signals self-driving pulls from",
      },
    ],
  },
  {
    id: "app-store",
    title: "App Store screenshots",
    what: "The screenshots for PostHog's iPhone app listing. Each one is a headline over the app on the dark gradient, and in order they tell the story: the app on your phone, your agents' inbox, asking for a fix, then analytics, web analytics, session replay and error tracking.",
    how: [
      "Upload them in this order. They're 1320×2868, the App Store's 6.9-inch iPhone size, which it scales down for smaller iPhones.",
      "They also work wherever you show the app on a phone: a launch post, a slide or a social post.",
    ],
    frame: { width: 440, height: 956 },
    // 440×956 is the iPhone's size in points; 3x is the App Store's 1320×2868.
    scale: 3,
    previewWidth: 600,
    images: [
      {
        id: "app-hog-in-your-pocket",
        name: "Is that a hog in your pocket?",
        figmaNode: "2630:751",
        alt: "“Is that a hog in your pocket?”: an iPhone home screen with the PostHog widget",
      },
      {
        id: "app-task-your-agents",
        name: "Task your agents",
        figmaNode: "2630:852",
        alt: "“Task your agents”: the PostHog inbox of ideas and bugs",
      },
      {
        id: "app-ship-a-fix",
        name: "@PostHog can you ship a fix?",
        figmaNode: "2630:1001",
        alt: "“@PostHog can you ship a fix?”: a chat where PostHog finds the bug and starts a fix",
      },
      {
        id: "app-pull-request",
        name: "Ask it to fix things",
        figmaNode: "2630:1023",
        alt: "“Yes.” Ask it to fix things: PostHog opens a pull request",
      },
      {
        id: "app-see-what-worked",
        name: "See what worked",
        figmaNode: "2630:1055",
        alt: "“See what worked”: pinned dashboards and insights in the app",
      },
      {
        id: "app-track-your-data",
        name: "Track your data",
        figmaNode: "2630:1136",
        alt: "“Track your data”: web analytics on an iPhone",
      },
      {
        id: "app-watching-traffic",
        name: "Watching traffic has never been so interesting",
        figmaNode: "2630:1180",
        alt: "“Watching traffic has never been so interesting”: the live web analytics overview",
      },
      {
        id: "app-watch-user-reaction",
        name: "Watch user reaction",
        figmaNode: "2630:1224",
        alt: "“Watch user reaction”: a list of session recordings with one-line summaries",
      },
      {
        id: "app-find-what-to-fix",
        name: "Find what to fix next",
        figmaNode: "2630:1314",
        alt: "“Find what to fix next”: error tracking on an iPhone",
      },
      {
        id: "app-who-when-which-release",
        name: "Who, when, and which release",
        figmaNode: "2630:1359",
        alt: "“Who, when, and which release”: an error's impact, release and where it breaks",
      },
    ],
  },
]

export const MARKETING_ASSETS_PATH = "/marketing-assets"

/** Every marketing asset, in page order, with its group. */
export const MARKETING_ASSETS: readonly (MarketingAsset & { group: MarketingAssetGroup })[] =
  MARKETING_ASSET_GROUPS.flatMap((group) => group.images.map((image) => ({ ...image, group })))

/** Size of an image's PNG, in px. */
export function marketingAssetSize(group: MarketingAssetGroup): { width: number; height: number } {
  return { width: group.frame.width * group.scale, height: group.frame.height * group.scale }
}

/** Site path of an image's full-resolution PNG. */
export function marketingAssetPath(id: string): string {
  return `${MARKETING_ASSETS_PATH}/${id}.png`
}

/** Site path of the smaller WebP the page shows. */
export function marketingPreviewPath(id: string): string {
  return `${MARKETING_ASSETS_PATH}/previews/${id}.webp`
}

/** Base name a downloaded copy is saved as. */
export function marketingFileName(id: string): string {
  return `posthog-marketing-${id}`
}
