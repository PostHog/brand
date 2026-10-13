import { track } from "../analytics.ts"
import { CopyButton } from "./CopyButton.tsx"

interface CodeBlockProps {
  /** Source to render and copy. */
  code: string
}

/** A dark code block with a copy-to-clipboard button in the corner. */
export function CodeBlock({ code }: CodeBlockProps) {
  return (
    <div className="code">
      <CopyButton
        value={code}
        // The first line identifies the snippet well enough (usually its import).
        onCopied={() => track("code copied", { snippet: code.split("\n", 1)[0] })}
      />
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  )
}
