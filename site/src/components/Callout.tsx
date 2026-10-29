import type { ReactNode } from "react"

// posthog.com's callout box (its `CalloutBox`): a full tinted border, an icon beside a bold
// title, the body indented under it. The glyphs are copied from @posthog/icons.
const CALLOUT_ICONS = {
  do: [
    "M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17ZM2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm13.475-3.08a.75.75 0 0 1 .106 1.055l-4.5 5.5a.75.75 0 0 1-1.111.055l-2-2a.75.75 0 1 1 1.06-1.06l1.414 1.414 3.975-4.859a.75.75 0 0 1 1.056-.105Z",
  ],
  dont: [
    "M12.216 3.602a.25.25 0 0 0-.432 0L3.28 18.124a.25.25 0 0 0 .216.376h17.01a.25.25 0 0 0 .216-.376L12.216 3.602Zm-1.726-.758a1.75 1.75 0 0 1 3.02 0l8.505 14.522C22.7 18.532 21.857 20 20.505 20H3.495c-1.352 0-2.194-1.468-1.51-2.634L10.49 2.844ZM12 9a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 12 9Z",
    "M13 15.75a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z",
  ],
  info: [
    "M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17ZM2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm8-1a.75.75 0 0 1 .75-.75H12a.75.75 0 0 1 .75.75v5.25a.75.75 0 0 1-1.5 0v-4.5h-.5A.75.75 0 0 1 10 11Z",
    "M13 7.75a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z",
  ],
} as const

interface CalloutProps {
  type: keyof typeof CALLOUT_ICONS
  title: string
  children: ReactNode
}

export function Callout({ type, title, children }: CalloutProps) {
  return (
    <div className={`callout callout-${type}`}>
      <div className="callout-title">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          {CALLOUT_ICONS[type].map((d) => (
            <path key={d} fillRule="evenodd" clipRule="evenodd" d={d} />
          ))}
        </svg>
        <strong>{title}</strong>
      </div>
      <div className="callout-body">{children}</div>
    </div>
  )
}
