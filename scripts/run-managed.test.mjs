import assert from "node:assert/strict"
import { mkdtemp, readFile, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { spawn } from "node:child_process"
import { test } from "node:test"
import { fileURLToPath } from "node:url"

const runner = path.join(path.dirname(fileURLToPath(import.meta.url)), "run-managed.mjs")

function run(args, cwd, extra = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [runner, ...args], {
      cwd,
      env: { ...process.env, ...extra },
      stdio: ["ignore", "pipe", "pipe"],
    })
    let stdout = ""
    let stderr = ""
    child.stdout.on("data", chunk => { stdout += chunk })
    child.stderr.on("data", chunk => { stderr += chunk })
    child.once("error", reject)
    child.once("exit", (code, signal) => resolve({ code, signal, stdout, stderr }))
  })
}

test("managed child reads dotenv as empty without changing the file", async () => {
  const cwd = await mkdtemp(path.join(tmpdir(), "kvarteret-managed-"))
  const dotenv = path.join(cwd, ".env.local")
  await writeFile(dotenv, "SECRET_VALUE=keep-me\n")
  const result = await run([process.execPath, "-e", "const fs=require('node:fs'); Promise.all([new Promise(r=>fs.readFile('.env.local','utf8',(_,v)=>r(v))), fs.promises.readFile('.env.local','utf8')]).then(v=>process.stdout.write(v.join('|')))"], cwd, {
    KVARERET_DISABLE_DOTENV: "1",
  })
  assert.equal(result.code, 0)
  assert.equal(result.stdout, "|")
  assert.equal(await readFile(dotenv, "utf8"), "SECRET_VALUE=keep-me\n")
})

test("a killed managed child leaves dotenv untouched", async () => {
  const cwd = await mkdtemp(path.join(tmpdir(), "kvarteret-managed-"))
  const dotenv = path.join(cwd, ".env")
  await writeFile(dotenv, "SECRET_VALUE=keep-me\n")
  const child = spawn(process.execPath, [runner, "-e", "setTimeout(() => {}, 60_000)"], {
    cwd,
    env: { ...process.env, KVARERET_DISABLE_DOTENV: "1" },
    stdio: "ignore",
  })
  await new Promise(resolve => child.once("spawn", resolve))
  child.kill("SIGKILL")
  await new Promise(resolve => child.once("exit", resolve))
  assert.equal(await readFile(dotenv, "utf8"), "SECRET_VALUE=keep-me\n")
  assert.equal(existsSync(dotenv), true)
})

test("unmanaged child reads dotenv normally", async () => {
  const cwd = await mkdtemp(path.join(tmpdir(), "kvarteret-managed-"))
  const dotenv = path.join(cwd, ".env")
  await writeFile(dotenv, "SECRET_VALUE=keep-me\n")
  const result = await run([process.execPath, "-e", "process.stdout.write(require('node:fs').readFileSync('.env', 'utf8'))"], cwd)
  assert.equal(result.code, 0)
  assert.equal(result.stdout, "SECRET_VALUE=keep-me\n")
})
