// The settings panel's controls. They use the site's .input and .seg (theme.css); layout is in
// maker.css.

import { type ReactNode, useEffect, useId, useState } from "react"
import { imageFailed, onAssetLoad } from "./canvas.ts"

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mk-section">
      <h2>{title}</h2>
      {children}
    </section>
  )
}

export function Hint({ children, warn }: { children: ReactNode; warn?: boolean }) {
  return <span className={warn ? "hint warn" : "hint"}>{children}</span>
}

/** Re-renders when an image (or font) a drawing asked for finishes loading or fails. */
function useAssetLoads(): void {
  const [, bump] = useState(0)
  useEffect(() => onAssetLoad(() => bump((n) => n + 1)), [])
}

/**
 * A warning for pictures the drawing couldn't load, which it leaves out (a logo becomes the
 * company name). The settings' own thumbnails still show them, since an <img> doesn't need the
 * picture's server to allow other sites, so without this the image just looks broken. A picture
 * from another site usually fails because that site doesn't allow it (CORS); the fix is to
 * upload the file. `minWidth` must match what the drawing loads it at.
 */
export function PictureError({
  urls,
  what,
  minWidth = 0,
}: {
  urls: readonly (string | null | undefined)[]
  /** What the pictures are: "logo", "image". */
  what: string
  minWidth?: number
}) {
  useAssetLoads()
  const failed = urls.filter((url): url is string => !!url && imageFailed(url, minWidth))
  if (!failed.length) return null
  const hosts = [
    ...new Set(
      failed
        .filter((url) => /^https?:/i.test(url))
        .map((url) => new URL(url).hostname)
        .filter((host) => host !== window.location.hostname),
    ),
  ]
  const which = failed.length > 1 ? `${failed.length} ${what}s` : `The ${what}`
  return (
    <Hint warn>
      {hosts.length
        ? `${which} from ${hosts.join(" and ")} can’t be drawn: that site doesn’t let other sites use its images, or the link is broken. Download the file and upload it here instead.`
        : `${which} didn’t load. Try the file again, as a PNG, JPG or SVG.`}
    </Hint>
  )
}

/** A labelled control. `children` gets the id to put on the control the label names. */
export function Field({
  label,
  hint,
  children,
}: {
  label: ReactNode
  hint?: ReactNode
  children: (id: string) => ReactNode
}) {
  const id = useId()
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children(id)}
      {hint}
    </div>
  )
}

export function TextField({
  label,
  value,
  onChange,
  hint,
  rows,
  placeholder,
  className,
}: {
  label: ReactNode
  value: string
  onChange: (value: string) => void
  hint?: ReactNode
  /** Rows for a multi-line field; a one-line input without it. */
  rows?: number
  placeholder?: string
  className?: string
}) {
  return (
    <Field label={label} hint={hint}>
      {(id) =>
        rows ? (
          <textarea
            id={id}
            className={className ? `input ${className}` : "input"}
            rows={rows}
            spellCheck
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        ) : (
          <input
            id={id}
            className={className ? `input ${className}` : "input"}
            type="text"
            autoComplete="off"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        )
      }
    </Field>
  )
}

export function Range({
  label,
  value,
  min,
  max,
  step,
  suffix = "",
  onChange,
}: {
  label: ReactNode
  value: number
  min: number
  max: number
  step: number
  suffix?: string
  onChange: (value: number) => void
}) {
  return (
    <Field label={label}>
      {(id) => (
        <div className="range-row">
          <input
            id={id}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(+e.target.value)}
          />
          <output htmlFor={id}>
            {value}
            {suffix}
          </output>
        </div>
      )}
    </Field>
  )
}

export function Switch({
  checked,
  onChange,
  disabled,
  children,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <label className="switch">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />{" "}
      <span>{children}</span>
    </label>
  )
}

export interface SwatchOption<K extends string> {
  key: K
  /** CSS background for the swatch. */
  color: string
  label?: string
}

export function Swatches<K extends string>({
  label,
  options,
  value,
  onChange,
  hint,
}: {
  label: ReactNode
  options: SwatchOption<K>[]
  value: K | null | undefined
  onChange: (key: K) => void
  hint?: ReactNode
}) {
  const id = useId()
  return (
    <div className="field">
      <span className="lbl" id={id}>
        {label}
      </span>
      <div className="swatches" role="group" aria-labelledby={id}>
        {options.map((o) => (
          <button
            key={o.key}
            type="button"
            className="sw"
            style={{ background: o.color }}
            aria-label={o.label ?? o.key}
            title={o.label ?? o.key}
            aria-pressed={o.key === value}
            onClick={() => onChange(o.key)}
          />
        ))}
      </div>
      {hint}
    </div>
  )
}

export function Segmented<V extends string>({
  label,
  options,
  value,
  onChange,
  hint,
}: {
  label: ReactNode
  options: { value: V; label: string; disabled?: boolean }[]
  value: V
  onChange: (value: V) => void
  hint?: ReactNode
}) {
  const id = useId()
  return (
    <div className="field">
      <span className="lbl" id={id}>
        {label}
      </span>
      <div className="seg" role="group" aria-labelledby={id}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={o.value === value}
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
      {hint}
    </div>
  )
}

/** A picture with its name and buttons: a hoggie, or an upload. */
export function PictureCard({
  kind,
  picture,
  pictureLabel,
  onPictureClick,
  name,
  how,
  children,
}: {
  kind: "hog-card" | "pic-card"
  picture: ReactNode
  pictureLabel: string
  onPictureClick: () => void
  name: ReactNode
  how?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className={kind}>
      <button className="pic" type="button" aria-label={pictureLabel} onClick={onPictureClick}>
        {picture}
      </button>
      <div className="info">
        <span className="name">{name}</span>
        {how ? <span className="how">{how}</span> : null}
        {children ? <div className="actions">{children}</div> : null}
      </div>
    </div>
  )
}
