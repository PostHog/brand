import type { CopyStatus } from "./CopyMenu.tsx"

/**
 * The copy outcome, flashed over whatever was clicked: orange with the label when it worked,
 * coral when it didn't. It fades as the status clears. Place it inside a positioned trigger.
 */
export function CopyFlash({ status }: { status: CopyStatus | null }) {
  return (
    <span
      className={`copy-flash${status ? " show" : ""}${status && !status.ok ? " failed" : ""}`}
      aria-live="polite"
    >
      {status?.label}
    </span>
  )
}
