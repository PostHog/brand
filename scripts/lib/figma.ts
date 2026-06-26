// Minimal, rate-limit-aware Figma REST client. The ONLY thing that talks to Figma.
//
// Figma meters the API endpoints (GET file / nodes / images) per seat — a Dev/Full
// seat allows ~10-20 req/min. Downloading the rendered images from their S3 URLs is
// NOT metered, so we render in big batches and pull the bytes freely. Metered calls
// are serialized, spaced by FIGMA_MIN_INTERVAL_MS, and retried with backoff on 429/5xx.

const API = "https://api.figma.com/v1"

/** A node in the Figma document tree (only the fields we use are typed). */
export interface FigmaNode {
  id: string
  name: string
  type: string
  visible?: boolean
  children?: FigmaNode[]
  fills?: FigmaPaint[]
  characters?: string
  absoluteBoundingBox?: { x: number; y: number; width: number; height: number } | null
  componentPropertyDefinitions?: Record<string, unknown>
  [key: string]: unknown
}

export interface FigmaColor {
  r: number
  g: number
  b: number
  a: number
}

export interface FigmaPaint {
  type: string // "SOLID" | "GRADIENT_LINEAR" | "IMAGE" | ...
  visible?: boolean
  color?: FigmaColor
  gradientStops?: { color: FigmaColor; position: number }[]
  imageRef?: string
}

export interface FigmaFileMeta {
  name: string
  version: string
  lastModified: string
}

/** Metadata for a COMPONENT / COMPONENT_SET (only the fields we use). */
export interface FigmaComponentMeta {
  key: string
  name: string
  /** The editable description shown in Figma's right panel — where we read tags from. */
  description: string
  componentSetId?: string
}

/** Result of {@link FigmaClient.getNodes}: the requested subtrees + their component metadata. */
export interface FigmaNodesResult {
  /** Requested root id → its document subtree. */
  nodes: Record<string, FigmaNode>
  /**
   * Every COMPONENT and COMPONENT_SET found within the requested subtrees, keyed by node
   * id (Figma's `components` and `componentSets` maps merged — both carry `description`).
   */
  components: Record<string, FigmaComponentMeta>
}

export type ImageFormat = "svg" | "png"

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

export class FigmaClient {
  readonly #token: string
  readonly #minInterval: number
  #lastRequestAt = 0
  #gate: Promise<unknown> = Promise.resolve()

  constructor(opts: { token?: string; minIntervalMs?: number } = {}) {
    const token = opts.token ?? process.env.FIGMA_TOKEN
    if (!token) {
      throw new Error("FIGMA_TOKEN is required (a Dev/Full-seat personal access token).")
    }
    this.#token = token
    this.#minInterval = opts.minIntervalMs ?? Number(process.env.FIGMA_MIN_INTERVAL_MS ?? 4000)
  }

  /** Serialized, spaced, retried GET against a metered Figma API endpoint. */
  async #request<T>(path: string, attempts = 5): Promise<T> {
    const run = this.#gate.then(async (): Promise<T> => {
      for (let i = 0; i < attempts; i++) {
        const wait = this.#minInterval - (Date.now() - this.#lastRequestAt)
        if (wait > 0) await sleep(wait)
        this.#lastRequestAt = Date.now()

        let res: Response
        try {
          res = await fetch(`${API}${path}`, { headers: { "X-Figma-Token": this.#token } })
        } catch (err) {
          if (i === attempts - 1) throw err
          await sleep(this.#backoff(i))
          continue
        }

        if (res.ok) return (await res.json()) as T

        if (res.status === 429 || res.status >= 500) {
          const retryAfter = Number(res.headers.get("retry-after"))
          const delay =
            Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : this.#backoff(i)
          console.warn(
            `  figma ${res.status} on ${path} — retrying in ${Math.round(delay / 1000)}s`,
          )
          await sleep(delay)
          continue
        }
        throw new Error(`Figma ${res.status} ${res.statusText} for ${path}`)
      }
      throw new Error(`Figma request failed after ${attempts} attempts: ${path}`)
    })
    // Keep the gate chain alive even if this request rejects.
    this.#gate = run.then(
      () => undefined,
      () => undefined,
    )
    return run
  }

  #backoff(attempt: number): number {
    return Math.min(60_000, 1000 * 2 ** attempt)
  }

  /** File-level metadata (cheap; `depth=1`). Used for the version early-exit. */
  async getFileMeta(key: string): Promise<FigmaFileMeta> {
    const data = await this.#request<FigmaFileMeta>(`/files/${key}?depth=1`)
    return { name: data.name, version: data.version, lastModified: data.lastModified }
  }

  /**
   * Fetch one or more node subtrees. Returns each requested root's document plus the
   * merged COMPONENT / COMPONENT_SET metadata (incl. descriptions) found within them.
   */
  async getNodes(
    key: string,
    ids: string[],
    opts: { depth?: number; geometry?: "paths" } = {},
  ): Promise<FigmaNodesResult> {
    const params = new URLSearchParams({ ids: ids.join(",") })
    if (opts.depth != null) params.set("depth", String(opts.depth))
    if (opts.geometry) params.set("geometry", opts.geometry)
    const data = await this.#request<{
      nodes: Record<
        string,
        {
          document: FigmaNode
          components?: Record<string, FigmaComponentMeta>
          componentSets?: Record<string, FigmaComponentMeta>
        } | null
      >
    }>(`/files/${key}/nodes?${params}`)
    const nodes: Record<string, FigmaNode> = {}
    const components: Record<string, FigmaComponentMeta> = {}
    for (const [id, entry] of Object.entries(data.nodes)) {
      if (!entry?.document) continue
      nodes[id] = entry.document
      Object.assign(components, entry.components, entry.componentSets)
    }
    return { nodes, components }
  }

  /**
   * Render nodes to images, returning a map of node id -> temporary S3 URL (or null
   * when Figma couldn't render it). Chunked so one metered call renders many nodes.
   */
  async renderImages(
    key: string,
    ids: string[],
    format: ImageFormat,
    opts: { scale?: number; chunkSize?: number } = {},
  ): Promise<Record<string, string | null>> {
    const chunkSize = opts.chunkSize ?? 50
    const out: Record<string, string | null> = {}
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize)
      const params = new URLSearchParams({ ids: chunk.join(","), format })
      if (format === "png" && opts.scale) params.set("scale", String(opts.scale))
      const data = await this.#request<{
        err: string | null
        images: Record<string, string | null>
      }>(`/images/${key}?${params}`)
      if (data.err) throw new Error(`Figma image render error: ${data.err}`)
      Object.assign(out, data.images)
    }
    return out
  }

  /** Download a rendered asset from its S3 URL. NOT rate-limited by Figma. */
  async downloadText(url: string): Promise<string> {
    return (await this.#fetchAsset(url)).text()
  }

  async downloadBytes(url: string): Promise<Uint8Array> {
    return new Uint8Array(await (await this.#fetchAsset(url)).arrayBuffer())
  }

  async #fetchAsset(url: string, attempts = 4): Promise<Response> {
    let lastErr: unknown
    for (let i = 0; i < attempts; i++) {
      try {
        const res = await fetch(url)
        if (res.ok) return res
        lastErr = new Error(`${res.status} ${res.statusText} for ${url}`)
      } catch (err) {
        lastErr = err
      }
      await sleep(this.#backoff(i))
    }
    throw lastErr
  }
}
