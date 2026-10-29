import posthog from "posthog-js"
import { useMemo } from "react"
import { highlight } from "sugar-high"
import { CopyButton } from "./CopyButton.tsx"

interface CodeBlockProps {
  /** Source to render and copy. */
  code: string
  /** Stable id for this snippet, sent as `snippet` on the `code copied` event. */
  slug: string
  /** Show it as plain text, for code the TSX highlighter would misread (e.g. Markdown). */
  plain?: boolean
}

/**
 * A syntax-highlighted TSX snippet with a copy button in the corner. `sugar-high` emits
 * escaped spans whose colors come from the `--sh-*` custom properties in theme.css.
 */
export function CodeBlock({ code, slug, plain = false }: CodeBlockProps) {
  const html = useMemo(() => (plain ? null : highlight(code)), [code, plain])
  return (
    <div className="code">
      <CopyButton value={code} onCopied={() => posthog.capture("code copied", { snippet: slug })} />
      <pre>
        {html === null ? <code>{code}</code> : <code dangerouslySetInnerHTML={{ __html: html }} />}
      </pre>
    </div>
  )
}
