// Chrome origin trials (https://developer.chrome.com/docs/web-platform/origin-trials): a trial
// feature is on for every visitor, no flag, on pages that carry the trial's token. This puts one
// `<meta http-equiv="origin-trial">` per token in the head of `index.html` — and so of every
// prerendered route, which seo-plugin.ts stamps out from the built `index.html`.
//
// The tokens come from the build-time env var `WEBMCP_ORIGIN_TRIAL_TOKEN` (committed in
// `site/.env.production`, overridable from the Cloudflare Pages environment; several tokens can
// be separated by whitespace or commas). They're public and bound to one origin
// (brand.posthog.com), so they're harmless on previews and localhost, where Chrome ignores them.

import { type HtmlTagDescriptor, loadEnv, type Plugin } from "vite"

const ENV_VAR = "WEBMCP_ORIGIN_TRIAL_TOKEN"

export function originTrials(): Plugin {
  let tokens: string[] = []

  return {
    name: "origin-trials",

    configResolved(config) {
      const env = loadEnv(config.mode, config.envDir || config.root, ENV_VAR)
      tokens = (env[ENV_VAR] ?? "").split(/[\s,]+/).filter(Boolean)
    },

    transformIndexHtml: (): HtmlTagDescriptor[] =>
      tokens.map((token) => ({
        tag: "meta",
        attrs: { "http-equiv": "origin-trial", content: token },
        injectTo: "head-prepend",
      })),
  }
}
