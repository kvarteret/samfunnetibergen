#!/usr/bin/env node

import { spawn } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

const command = process.argv[2]
const args = process.argv.slice(3)
if (!command) {
  console.error("usage: run-managed.mjs COMMAND [ARGS…]")
  process.exit(2)
}

const env = { ...process.env }
if (env.KVARERET_DISABLE_DOTENV === "1") {
  const guard = path.join(path.dirname(fileURLToPath(import.meta.url)), "block-dotenv.cjs")
  const option = `--require=${JSON.stringify(guard)}`
  env.NODE_OPTIONS = env.NODE_OPTIONS ? `${option} ${env.NODE_OPTIONS}` : option
}

const child = spawn(command, args, {
  cwd: process.cwd(),
  env,
  stdio: "inherit",
  shell: false,
})
const forwardInterrupt = () => child.kill("SIGINT")
const forwardTerminate = () => child.kill("SIGTERM")
process.once("SIGINT", forwardInterrupt)
process.once("SIGTERM", forwardTerminate)
child.once("error", error => {
  process.removeListener("SIGINT", forwardInterrupt)
  process.removeListener("SIGTERM", forwardTerminate)
  console.error(`[run-managed] ${error.message}`)
  process.exitCode = 1
})
child.once("exit", (code, signal) => {
  process.removeListener("SIGINT", forwardInterrupt)
  process.removeListener("SIGTERM", forwardTerminate)
  process.exitCode = signal ? 128 + signalNumber(signal) : (code ?? 1)
})

function signalNumber(signal) {
  return { SIGHUP: 1, SIGINT: 2, SIGTERM: 15 }[signal] ?? 1
}
