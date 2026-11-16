import posthog from "posthog-js"
import { useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { createHost } from "../image-maker/host.ts"
import "../image-maker/maker.css"
import { makerBySlug } from "../image-maker/makers.ts"
import { useSeo } from "../useSeo.ts"
import { NotFoundPage } from "./NotFound.tsx"

// One image maker (/tools/images/<slug>). The maker's own code draws and edits the image; this
// page loads it, hands it the site's storage, uploads and downloads (host.ts), and adds a
// "Copy link" button beside its download controls.

function MakerView({ slug }: { slug: string }) {
  const maker = makerBySlug(slug)!
  useSeo(`/tools/images/${slug}`)
  const root = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const [markup, setMarkup] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState<Awaited<ReturnType<typeof maker.load>> | null>(null)

  useEffect(() => {
    let live = true
    maker.load().then(
      (result) => {
        if (!live) return
        setLoaded(result)
        setMarkup(result.module.MARKUP)
      },
      () => live && setFailed(true),
    )
    return () => {
      live = false
    }
  }, [maker])

  useEffect(() => {
    const el = root.current
    if (!loaded || !el || !markup) return
    const base = createHost(slug)
    const host = {
      use: async (name: string) => {
        const ns = await base.use(name)
        if (name !== "downloads" || !ns) return ns
        // Count downloads like the rest of the site's events.
        const downloads = ns as { save: (o: { filename: string; data: Blob }) => Promise<void> }
        return {
          save: (o: { filename: string; data: Blob }) =>
            downloads.save(o).then(() => {
              posthog.capture("image downloaded", { format: slug, filename: o.filename })
            }),
        }
      },
    }
    const cleanup = loaded.module.mount({ data: loaded.data, host })

    // The "image makers" chip goes home without a full page load.
    const home = el.querySelector<HTMLAnchorElement>("[data-mk-home]")
    const goHome = (e: MouseEvent) => {
      e.preventDefault()
      navigate("/tools/images")
    }
    home?.addEventListener("click", goHome)

    // Copy link: the URL already carries the current image (host.ts keeps it up to date).
    const actions = el.querySelector(".mh-side .dl")
    const copy = document.createElement("button")
    copy.type = "button"
    copy.className = "btn"
    copy.textContent = "Copy link"
    copy.addEventListener("click", () => {
      const done = () => {
        copy.textContent = "Link copied"
        posthog.capture("image link copied", { format: slug })
        window.setTimeout(() => (copy.textContent = "Copy link"), 1600)
      }
      navigator.clipboard.writeText(window.location.href).then(done, () => {
        copy.textContent = "Copy the address bar"
      })
    })
    actions?.prepend(copy)

    return () => {
      home?.removeEventListener("click", goHome)
      copy.remove()
      cleanup()
      base.dispose()
    }
  }, [loaded, markup, slug, navigate])

  if (failed) {
    return (
      <p className="route-loading">
        The {maker.name.toLowerCase()} maker didn’t load. Reload the page to try again.
      </p>
    )
  }
  if (!markup) return <p className="route-loading">Loading the maker…</p>
  return (
    <div
      ref={root}
      className={`mk mk-${maker.engine}`}
      // The maker's own markup, from its ported artifact (static, ours).
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  )
}

export function ImageMakerPage() {
  const { slug } = useParams()
  if (!makerBySlug(slug)) return <NotFoundPage />
  // Keyed so switching makers remounts cleanly.
  return <MakerView key={slug} slug={slug!} />
}
