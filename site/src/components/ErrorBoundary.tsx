import { Logo } from "@posthog/brand/logo"
import { Component, type ErrorInfo, type ReactNode } from "react"

/**
 * True for the "I couldn't download a route chunk" family of errors. The common cause is a
 * stale deploy: Cloudflare Pages ships new hashed filenames, and a tab still holding the
 * old `index.html` 404s the moment it lazy-loads a route. A reload picks up the new
 * `index.html`, so those get their own copy + an offer to reload rather than a scary
 * stack trace.
 */
export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
  return /failed to fetch dynamically imported module|error loading dynamically imported module|importing a module script failed|chunkloaderror|dynamically imported module/i.test(
    message,
  )
}

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * Catches render-time throws so one broken subtree doesn't blank the entire app. Without
 * it, React unmounts the whole root on any error — most often a `React.lazy` route chunk
 * that failed to download — leaving a white page with nothing but a console message.
 *
 * `App` mounts this keyed on the pathname, so navigating elsewhere clears a caught error.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Unhandled render error:", error, info.componentStack)
  }

  render(): ReactNode {
    const { error } = this.state
    if (!error) {
      return this.props.children
    }

    const stale = isChunkLoadError(error)
    return (
      <div className="empty" role="alert">
        <Logo.Logomark variant="mono" size={48} color="var(--text-muted)" />
        <p className="empty-title">{stale ? "This page is out of date" : "Something went wrong"}</p>
        <p className="empty-hint">
          {stale
            ? "The site was updated while this tab was open, so part of it could no longer be downloaded. Reloading picks up the new version."
            : "This part of the site failed to render. Reloading usually fixes it."}
        </p>
        {!stale ? (
          <p className="empty-hint">
            <code>{error.message}</code>
          </p>
        ) : null}
        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
          Reload the page
        </button>
      </div>
    )
  }
}
