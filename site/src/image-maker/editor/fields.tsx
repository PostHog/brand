// The settings panel's controls. They use the site's .input and .seg (theme.css); layout is in
// maker.css.

import { type ReactNode, useId } from "react"

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
