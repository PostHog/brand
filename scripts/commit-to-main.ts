// Commits the working-tree changes under the given paths to a branch through GitHub's
// `createCommitOnBranch` GraphQL mutation (so a GitHub App token makes them verified commits),
// split into as many commits as it takes to keep each request under GitHub's 45 MB payload
// cap. Used by the sync workflow: a Figma edit that touches every hoggie re-renders them all,
// and their SVGs + PNGs base64-encoded in one request blow past that cap.
//
// Batches are packed by encoded size. Everything that ties the assets together — deletions,
// the catalogs, sync-state.json and the changeset — goes in the LAST commit, so each earlier
// commit only adds files nothing references yet or updates ones that already exist: every
// commit on main still builds, and the Release workflow (triggered by the changeset path)
// fires once, on the complete sync.
//
//   node scripts/commit-to-main.ts --message "chore: sync brand assets" [--branch main] [--dry-run] <path>...
//
// Needs GITHUB_TOKEN and GITHUB_REPOSITORY (owner/name). Each commit's expected head is the
// previous one, starting from the local HEAD, so it fails rather than clobbers if the branch
// moved since checkout.

import { execFileSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { basename, dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { parseArgs } from "node:util"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")

// GitHub rejects request bodies over 45 MB; base64 inflates files by 4/3. Leave headroom for
// the JSON envelope and paths.
const BATCH_BUDGET = 30 * 1024 * 1024

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    message: { type: "string" },
    branch: { type: "string", default: "main" },
    "dry-run": { type: "boolean", default: false },
  },
})
const message = values.message
if (!message || positionals.length === 0) {
  throw new Error("usage: commit-to-main.ts --message <msg> [--branch main] [--dry-run] <path>...")
}
const dryRun = values["dry-run"]

const git = (...args: string[]) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8" })

// Porcelain v1 with -z: "XY path\0", no rename pairs since nothing is staged and renames are off.
const changed = git(
  "status",
  "--porcelain=v1",
  "-z",
  "--untracked-files=all",
  "--no-renames",
  "--",
  ...positionals,
)
  .split("\0")
  .filter(Boolean)
  .map((line) => line.slice(3))

type Addition = { path: string; contents: string }
const additions: Addition[] = []
const deletions: string[] = []
for (const path of changed) {
  const abs = join(ROOT, path)
  if (existsSync(abs)) additions.push({ path, contents: readFileSync(abs).toString("base64") })
  else deletions.push(path)
}

if (additions.length === 0 && deletions.length === 0) {
  console.log("Nothing to commit.")
  process.exit(0)
}

// Files that describe the asset set rather than being one asset.
const isManifest = (path: string) =>
  path.startsWith(".changeset/") ||
  basename(path) === "catalog.json" ||
  basename(path) === "sync-state.json"

type Batch = { additions: Addition[]; deletions: string[]; size: number }
const newBatch = (): Batch => ({ additions: [], deletions: [], size: 0 })

const batches: Batch[] = []
let current = newBatch()
for (const file of additions.filter((a) => !isManifest(a.path))) {
  if (current.additions.length > 0 && current.size + file.contents.length > BATCH_BUDGET) {
    batches.push(current)
    current = newBatch()
  }
  current.additions.push(file)
  current.size += file.contents.length
}
// The final commit: deletions + manifests. Start a fresh one if they don't fit beside the
// last asset batch.
const final = additions.filter((a) => isManifest(a.path))
const finalSize = final.reduce((n, a) => n + a.contents.length, 0)
if (current.additions.length > 0 && current.size + finalSize > BATCH_BUDGET) {
  batches.push(current)
  current = newBatch()
}
current.additions.push(...final)
current.deletions.push(...deletions)
current.size += finalSize
batches.push(current)

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`
const headline = (i: number) =>
  batches.length === 1 ? message : `${message} (${i + 1}/${batches.length})`

if (dryRun) {
  batches.forEach((b, i) =>
    console.log(
      `${headline(i)}: ${b.additions.length} added/updated, ${b.deletions.length} deleted, ${mb(b.size)} encoded`,
    ),
  )
  process.exit(0)
}

const token = process.env.GITHUB_TOKEN
const repo = process.env.GITHUB_REPOSITORY
if (!token || !repo) throw new Error("GITHUB_TOKEN and GITHUB_REPOSITORY are required")

const MUTATION = `mutation ($input: CreateCommitOnBranchInput!) {
  createCommitOnBranch(input: $input) { commit { oid url } }
}`

let head = git("rev-parse", "HEAD").trim()
for (const [i, batch] of batches.entries()) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { authorization: `bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({
      query: MUTATION,
      variables: {
        input: {
          branch: { repositoryNameWithOwner: repo, branchName: values.branch },
          message: { headline: headline(i) },
          expectedHeadOid: head,
          fileChanges: {
            additions: batch.additions,
            deletions: batch.deletions.map((path) => ({ path })),
          },
        },
      },
    }),
  })
  const json = (await res.json()) as {
    data?: { createCommitOnBranch: { commit: { oid: string; url: string } } }
    errors?: unknown
  }
  if (!res.ok || json.errors || !json.data) {
    throw new Error(
      `Commit ${i + 1}/${batches.length} failed (HTTP ${res.status}): ${JSON.stringify(json.errors ?? json)}`,
    )
  }
  const { oid, url } = json.data.createCommitOnBranch.commit
  console.log(`${headline(i)} (${mb(batch.size)}): ${url}`)
  head = oid
}
