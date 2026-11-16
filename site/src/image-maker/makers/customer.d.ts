// Types for the plain JS maker beside this file.
export declare const MARKUP: string
export declare function mount(env: {
  data: unknown
  host: { use: (name: string) => Promise<unknown> }
}): () => void
