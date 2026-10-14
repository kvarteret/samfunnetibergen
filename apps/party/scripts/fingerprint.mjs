#!/usr/bin/env node
// Decides whether the lekeplass Worker needs deploying by comparing what
// wrangler would upload with what is live, rather than which files changed.
//
// The fingerprint hashes the bundled Worker and wrangler.jsonc. Every deploy
// through this script records it in the version message, so a later check
// can read it back from the live version.
//
// Usage:
//   node scripts/fingerprint.mjs check           # prints fingerprint= and changed=
//   node scripts/fingerprint.mjs deploy [label]  # deploys, recording the fingerprint

import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const RECORDED = /fingerprint=([0-9a-f]{32})/

function wrangler(...args) {
  return execFileSync("npx", ["--no-install", "wrangler", ...args], {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  })
}

function localFingerprint() {
  const outdir = mkdtempSync(join(tmpdir(), "lekeplass-"))
  try {
    wrangler("deploy", "--dry-run", "--outdir", outdir)
    // The bundle is byte-for-byte reproducible. Its source map embeds local
    // paths, so it is left out.
    return createHash("sha256")
      .update(readFileSync(join(outdir, "index.js")))
      .update(readFileSync(join(ROOT, "wrangler.jsonc")))
      .digest("hex")
      .slice(0, 32)
  } finally {
    rmSync(outdir, { recursive: true, force: true })
  }
}

// The fingerprint recorded on the live version, or "" when there is none:
// a deploy that bypassed this script, or traffic split between versions.
function liveFingerprint() {
  const status = JSON.parse(wrangler("deployments", "status", "--json"))
  const versions = status.versions ?? []
  if (versions.length !== 1 || versions[0].percentage !== 100) return ""
  const version = JSON.parse(
    wrangler("versions", "view", versions[0].version_id, "--json"),
  )
  return version.annotations?.["workers/message"]?.match(RECORDED)?.[1] ?? ""
}

const [command, label = "manual"] = process.argv.slice(2)

if (process.env.CI && !process.env.CLOUDFLARE_API_TOKEN) {
  console.error(
    "CLOUDFLARE_API_TOKEN is missing from Samfunnet Deployments /party",
  )
  process.exit(1)
}

if (command === "check") {
  const local = localFingerprint()
  const live = liveFingerprint()
  console.error(`Lekeplass Worker: local ${local}, live ${live || "<none>"}`)
  console.log(`fingerprint=${local}`)
  console.log(`changed=${local !== live}`)
} else if (command === "deploy") {
  const local = localFingerprint()
  wrangler("deploy", "--message", `fingerprint=${local} ${label}`.slice(0, 100))
  console.error(`Deployed lekeplass Worker ${local}`)
} else {
  console.error("Usage: fingerprint.mjs check | deploy [label]")
  process.exit(2)
}
