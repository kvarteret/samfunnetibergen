#!/usr/bin/env node

import { spawnSync } from "node:child_process"
import { readFileSync, writeFileSync } from "node:fs"

const search = spawnSync(
  "rg",
  ["-l", "text-foreground/[0-9]+", "src", "--glob", "*.tsx"],
  { encoding: "utf8" },
)

if (search.status !== 0 && search.status !== 1) {
  throw new Error(search.stderr || "text-emphasis search failed")
}

const output = search.stdout.trim().split("\n").filter(Boolean)

const emphasisByOpacity = new Map([
  ["85", "muted"],
  ["80", "muted"],
  ["75", "muted"],
  ["70", "subtle"],
  ["65", "subtle"],
  ["60", "subtle"],
  ["55", "subtle"],
  ["50", "faint"],
  ["45", "faint"],
  ["40", "faint"],
  ["30", "faint"],
  ["25", "faint"],
  ["20", "faint"],
])

for (const file of output) {
  const source = readFileSync(file, "utf8")
  const next = source.replace(
    /text-foreground\/(85|80|75|70|65|60|55|50|45|40|30|25|20)\b/g,
    (_, opacity) => `text-foreground-${emphasisByOpacity.get(opacity)}`,
  )
  if (next !== source) {
    writeFileSync(file, next)
  }
}

console.log(`text-emphasis: scanned ${output.length} files`)
