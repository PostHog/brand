import posthog from "posthog-js"
import { CopyButton } from "./CopyButton.tsx"

interface CodeBlockProps {
  /** Source to render and copy. */
  code: string
  /** Stable id for this snippet, sent as `snippet` on the `code copied` event. */
  slug: string
}

/** A dark code block with a copy-to-clipboard button in the corner. */
export function CodeBlock({ code, slug }: CodeBlockProps) {
  return (
    <div className="code">
      <CopyButton value={code} onCopied={() => posthog.capture("code copied", { snippet: slug })} />
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  )
}
