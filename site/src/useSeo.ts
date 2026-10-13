import { useEffect } from "react"
import { markdownPath } from "./agent-paths.ts"
import {
  breadcrumbJsonLd,
  canonicalUrl,
  documentTitle,
  OG_IMAGE,
  OG_IMAGE_ALT,
  pageSeo,
  type PageImage,
  type PageSeo,
  SITE_NAME,
} from "./seo.ts"

/**
 * Keeps the document head in step with the route.
 *
 * The build bakes correct metadata into each route's HTML (see `seo-plugin.ts`), which is
 * what non-JS crawlers read. This hook covers the other half: once the SPA takes over,
 * client-side navigations never reload the document, so without it every page after the
 * first would keep the entry page's title, description, and canonical URL — which is what
 * a JS-rendering crawler (Googlebot) and the browser tab/history both end up recording.
 *
 * Tags are updated in place, by selector, so a prerendered tag is rewritten rather than
 * duplicated.
 */
export interface SeoOverrides {
  title?: string
  description?: string
  /** Breadcrumb label; defaults to the route's own. */
  label?: string
  /** Set for pages that should stay out of search results (404s, missing assets). */
  noindex?: boolean
  parent?: PageSeo["parent"]
  image?: PageImage
}

function upsert<E extends HTMLElement>(selector: string, create: () => E): E {
  const existing = document.head.querySelector<E>(selector)
  if (existing) return existing
  const created = create()
  document.head.appendChild(created)
  return created
}

function setMeta(key: string, kind: "name" | "property", content: string): void {
  const el = upsert<HTMLMetaElement>(`meta[${kind}="${key}"]`, () => {
    const meta = document.createElement("meta")
    meta.setAttribute(kind, key)
    return meta
  })
  el.content = content
}

export function useSeo(path: string, overrides: SeoOverrides = {}): void {
  const page = pageSeo(path)
  const title = overrides.title ?? page?.title ?? SITE_NAME
  const description = overrides.description ?? page?.description ?? ""
  const label = overrides.label ?? page?.label ?? title
  const url = canonicalUrl(path)
  const noindex = overrides.noindex ?? false
  const parent = overrides.parent ?? page?.parent
  const image = overrides.image ?? page?.image
  const imageUrl = image?.url ?? OG_IMAGE
  const imageAlt = image?.alt ?? OG_IMAGE_ALT
  const parentPath = parent?.path
  const parentLabel = parent?.label

  useEffect(() => {
    document.title = documentTitle(title, path)

    setMeta("description", "name", description)
    setMeta("og:title", "property", title)
    setMeta("og:description", "property", description)
    setMeta("og:url", "property", url)
    setMeta("og:image", "property", imageUrl)
    setMeta("og:image:alt", "property", imageAlt)
    setMeta("twitter:image", "name", imageUrl)
    setMeta("twitter:title", "name", title)
    setMeta("twitter:description", "name", description)
    // A soft 404 (or any other thin page) should not be indexed; everything else inherits
    // the document default, so the tag is rewritten rather than left behind on the next nav.
    setMeta(
      "robots",
      "name",
      noindex ? "noindex, follow" : "index, follow, max-image-preview:large",
    )

    upsert<HTMLLinkElement>('link[rel="canonical"]', () => {
      const link = document.createElement("link")
      link.rel = "canonical"
      return link
    }).href = url

    // The page's markdown twin, for agents that read the live DOM. A missing asset has none.
    const alternate = document.head.querySelector<HTMLLinkElement>(
      'link[rel="alternate"][type="text/markdown"]',
    )
    if (noindex) alternate?.remove()
    else {
      upsert<HTMLLinkElement>('link[rel="alternate"][type="text/markdown"]', () => {
        const link = document.createElement("link")
        link.rel = "alternate"
        link.type = "text/markdown"
        return link
      }).href = canonicalUrl(markdownPath(path))
    }

    upsert<HTMLScriptElement>('script[data-seo="breadcrumb"]', () => {
      const script = document.createElement("script")
      script.type = "application/ld+json"
      script.dataset.seo = "breadcrumb"
      return script
    }).textContent = breadcrumbJsonLd(
      path,
      label,
      parentPath && parentLabel ? { path: parentPath, label: parentLabel } : undefined,
    )
  }, [title, description, url, label, path, noindex, imageUrl, imageAlt, parentPath, parentLabel])
}
