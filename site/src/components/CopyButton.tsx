import { useCallback, useRef, useState } from "react"
import { copyToClipboard } from "../clipboard.ts"

interface CopyButtonProps {
  /** The text written to the clipboard. */
  value: string
  /** Button label before copying. Defaults to "Copy". */
  label?: string
  className?: string
  /** Called after `value` really landed on the clipboard. */
  onCopied?: () => void
}

/** A button that copies `value` to the clipboard and flips to "Copied!" briefly. */
export function CopyButton({ value, label = "Copy", className, onCopied }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const onCopy = useCallback(() => {
    void copyToClipboard(value).then((ok) => {
      if (!ok) {
        return
      }
      onCopied?.()
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 1200)
    })
  }, [value, onCopied])

  return (
    <button
      type="button"
      className={`btn${copied ? " copied" : ""}${className ? ` ${className}` : ""}`}
      onClick={onCopy}
    >
      {copied ? "Copied!" : label}
    </button>
  )
}
