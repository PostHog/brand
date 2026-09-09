import { useCallback, useRef, useState } from "react"
import { copyToClipboard } from "../clipboard.ts"

interface CopyButtonProps {
  /** The text written to the clipboard. */
  value: string
  /** Button label before copying. Defaults to "Copy". */
  label?: string
  className?: string
}

/** A button that copies `value` to the clipboard and flips to "Copied!" briefly. */
export function CopyButton({ value, label = "Copy", className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const onCopy = useCallback(() => {
    void copyToClipboard(value).then((ok) => {
      if (!ok) {
        return
      }
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 1200)
    })
  }, [value])

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
