#!/usr/bin/env node
// `allowScripts` lists the dependencies whose install scripts may run. The field
// is a declarative convention consumed by external installers rather than by npm
// itself (Sanity's own packages and `ws` ship it), so nothing fails loudly when
// it drifts out of sync with the tree. This check derives the authoritative set
// from `package-lock.json` and keeps every manifest in step.
//
// Usage:
//   node scripts/check-allow-scripts.mjs         # verify, exits non-zero on drift
//   node scripts/check-allow-scripts.mjs --fix   # rewrite the manifests

import { readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const MANIFESTS = ["package.json", "apps/web/package.json"]
const fix = process.argv.includes("--fix")

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(ROOT, relativePath), "utf8"))
}

function lastPathSegment(path) {
  const match = /node_modules\/((?:@[^/]+\/)?[^/]+)$/.exec(path)
  return match ? match[1] : path
}

function sorted(keys) {
  return Object.fromEntries([...keys].sort().map(key => [key, true]))
}

const lock = readJson("package-lock.json").packages
const expected = sorted(
  Object.entries(lock)
    .filter(([, entry]) => entry.hasInstallScript)
    .map(
      ([path, entry]) =>
        `${entry.name ?? lastPathSegment(path)}@${entry.version}`,
    ),
)

let drifted = false

for (const manifest of MANIFESTS) {
  const contents = readJson(manifest)
  const actual = sorted(Object.keys(contents.allowScripts ?? {}))
  const matches = JSON.stringify(actual) === JSON.stringify(expected)

  if (fix && !matches) {
    contents.allowScripts = expected
    writeFileSync(
      join(ROOT, manifest),
      `${JSON.stringify(contents, null, 2)}\n`,
    )
    console.log(`✔ ${manifest}: rewrote allowScripts`)
    continue
  }

  if (matches) {
    console.log(
      `✔ ${manifest}: allowScripts covers ${Object.keys(actual).length} install-script packages`,
    )
    continue
  }

  drifted = true
  console.error(`✖ ${manifest}: allowScripts does not match package-lock.json`)
  for (const key of Object.keys(expected)) {
    if (!(key in actual)) console.error(`    missing: ${key}`)
  }
  for (const key of Object.keys(actual)) {
    if (!(key in expected)) console.error(`    stale:   ${key}`)
  }
}

if (drifted) {
  console.error(
    "\nRun `node scripts/check-allow-scripts.mjs --fix` to regenerate them.",
  )
  process.exit(1)
}
