import { Suspense } from "react"
import { useParams } from "react-router-dom"
import { type Maker, makerBySlug } from "../image-maker/makers.ts"
import { useSeo } from "../useSeo.ts"
import { NotFoundPage } from "./NotFound.tsx"

// One image maker (/tools/images/<slug>). Each maker is its own lazily loaded component
// (image-maker/makers/<engine>/), built on the shared editor in image-maker/editor/.

function MakerView({ maker }: { maker: Maker }) {
  useSeo(`/tools/images/${maker.slug}`)
  const { Component } = maker
  return (
    <Suspense fallback={<p className="route-loading">Loading the maker…</p>}>
      <Component />
    </Suspense>
  )
}

export function ImageMakerPage() {
  const { slug } = useParams()
  const maker = makerBySlug(slug)
  if (!maker) return <NotFoundPage />
  // Keyed so switching makers remounts cleanly.
  return <MakerView key={maker.slug} maker={maker} />
}
