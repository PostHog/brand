/**
 * Speculatively warms a lazy route's chunk, so clicking a nav link swaps the page in with
 * no wait. `import()` is idempotent — the browser reuses the same module promise when the
 * route actually renders — so calling this repeatedly costs nothing after the first hit.
 *
 * Failures are swallowed: a prefetch is a guess, and if the chunk is genuinely gone the
 * real navigation surfaces it through the `ErrorBoundary`. Vite still fires
 * `vite:preloadError` on a failed fetch, and `main.tsx` reloads the tab on that — which
 * would be a nasty surprise when all the user did was move the mouse over a link, so
 * {@link isPrefetching} lets that handler sit out speculative loads.
 */
let inFlight = 0

export function prefetchRoute(load: () => Promise<unknown>): void {
  inFlight += 1
  load()
    .catch(() => {}) // A guess that didn't pay off; the click will report it if it matters.
    .finally(() => {
      inFlight -= 1
    })
}

/** True while at least one speculative route prefetch is still in flight. */
export function isPrefetching(): boolean {
  return inFlight > 0
}
