import assert from "node:assert/strict"
import { execFileSync, spawnSync } from "node:child_process"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { test } from "node:test"
import { fileURLToPath } from "node:url"

const script = fileURLToPath(
  new URL("./vercel-ignore-build.sh", import.meta.url),
)

test("Vercel skips unrelated changes and builds when inputs or history change", () => {
  const root = mkdtempSync(join(tmpdir(), "vercel-ignore-"))
  const git = (...args) =>
    execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim()
  const write = path => {
    mkdirSync(dirname(join(root, path)), { recursive: true })
    writeFileSync(join(root, path), "changed\n")
  }
  const status = (app, previousSha) =>
    spawnSync("bash", [script, app], {
      cwd: root,
      env: { ...process.env, VERCEL_GIT_PREVIOUS_SHA: previousSha },
      encoding: "utf8",
    }).status

  try {
    git("init", "--quiet")
    git("config", "user.email", "test@example.com")
    git("config", "user.name", "Test")
    write("README.md")
    git("add", ".")
    git("commit", "--quiet", "-m", "base")
    const base = git("rev-parse", "HEAD")
    assert.equal(status("web", base), 0)
    assert.equal(status("studio", ""), 1)
    assert.equal(status("web", "f".repeat(40)), 1)
    assert.equal(status("web", "--help"), 1)
    assert.equal(status("unknown", base), 1)

    for (const [path, web, studio] of [
      ["docs/guide.md", 0, 0],
      ["apps/web/src/page.ts", 1, 0],
      ["apps/studio/src/schema.ts", 0, 1],
      ["packages/content-domain/src/index.ts", 1, 1],
      ["pnpm-lock.yaml", 1, 1],
      ["pnpm-workspace.yaml", 1, 1],
      [".npmrc", 1, 1],
      ["scripts/build.mjs", 1, 1],
    ]) {
      const previous = git("rev-parse", "HEAD")
      write(path)
      git("add", ".")
      git("commit", "--quiet", "-m", path)
      assert.equal(status("web", previous), web, path)
      assert.equal(status("studio", previous), studio, path)
    }

    // Compare to the last deployment, not HEAD^: an unrelated later commit
    // must not hide an earlier app change that has not deployed yet.
    assert.equal(status("web", base), 1)
    assert.equal(status("studio", base), 1)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
