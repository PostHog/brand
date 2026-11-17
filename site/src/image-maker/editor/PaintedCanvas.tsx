import { type CanvasHTMLAttributes, useEffect, useRef, useState } from "react"
import { onAssetLoad } from "./canvas.ts"

interface PaintedCanvasProps extends Omit<
  CanvasHTMLAttributes<HTMLCanvasElement>,
  "width" | "height"
> {
  /** The drawing's own size. The canvas keeps this aspect ratio at whatever width CSS gives it. */
  width: number
  height: number
  /** Draws in the drawing's units; the canvas is already scaled for its size on screen. */
  paint: (ctx: CanvasRenderingContext2D) => void
}

/**
 * A canvas that paints a drawing sharply at its on-screen size, and paints again when it's
 * resized, when `paint` changes, and when an image or font the drawing asked for arrives.
 */
export function PaintedCanvas({ width, height, paint, style, ...rest }: PaintedCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const bump = () => setTick((t) => t + 1)
    const ro = new ResizeObserver(bump)
    ro.observe(el)
    const off = onAssetLoad(bump)
    return () => {
      ro.disconnect()
      off()
    }
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const frame = requestAnimationFrame(() => {
      const cssWidth = el.getBoundingClientRect().width || 300
      const dpr = window.devicePixelRatio || 1
      const pw = Math.max(200, Math.round(cssWidth * dpr))
      const ph = Math.round((pw * height) / width)
      if (el.width !== pw || el.height !== ph) {
        el.width = pw
        el.height = ph
      }
      const ctx = el.getContext("2d")!
      ctx.setTransform(pw / width, 0, 0, ph / height, 0, 0)
      ctx.clearRect(0, 0, width, height)
      paint(ctx)
    })
    return () => cancelAnimationFrame(frame)
  }, [paint, tick, width, height])

  return <canvas ref={ref} style={{ aspectRatio: `${width} / ${height}`, ...style }} {...rest} />
}
