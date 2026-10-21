import type { ReactNode } from "react"

interface PageHeaderProps {
  eyebrow?: string
  title: string
  children?: ReactNode
  /** Block content under the lede, e.g. a detail page's `<AssetFacts>`. */
  details?: ReactNode
}

/** Standard page heading: small eyebrow + title + optional lede paragraph. */
export function PageHeader({ eyebrow, title, children, details }: PageHeaderProps) {
  return (
    <header className="page-header">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h1>{title}</h1>
      {children ? <p>{children}</p> : null}
      {details}
    </header>
  )
}
