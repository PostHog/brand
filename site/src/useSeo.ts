import { useEffect } from "react"
import {
  breadcrumbJsonLd,
  canonicalUrl,
  documentTitle,
  OG_IMAGE,
  pageSeo,
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

  useEffect(() => {
    document.title = documentTitle(title, path)

    setMeta("description", "name", description)
    setMeta("og:title", "property", title)
    setMeta("og:description", "property", description)
    setMeta("og:url", "property", url)
    setMeta("og:image", "property", OG_IMAGE)
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

    upsert<HTMLScriptElement>('script[data-seo="breadcrumb"]', () => {
      const script = document.createElement("script")
      script.type = "application/ld+json"
      script.dataset.seo = "breadcrumb"
      return script
    }).textContent = breadcrumbJsonLd(path, label)
  }, [title, description, url, label, path, noindex])
}
