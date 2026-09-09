const fs = require("node:fs")
const moduleApi = require("node:module")

const originalSync = fs.readFileSync
const originalRead = fs.readFile
const originalPromiseRead = fs.promises.readFile

function isDotenvPath(file) {
  const name = typeof file === "string" ? file.split(/[\\/]/).pop() : file?.toString?.()
  return Boolean(name && /^\.env(?:\.|$)/.test(name) && !/^\.env\.(?:example|template)$/.test(name))
}

function emptyResult(options) {
  const encoding = typeof options === "string" ? options : options?.encoding
  return encoding ? "" : Buffer.alloc(0)
}

fs.readFileSync = function readFileSync(file, options) {
  if (isDotenvPath(file)) return emptyResult(options)
  return originalSync.call(this, file, options)
}

fs.readFile = function readFile(file, options, callback) {
  if (typeof options === "function") {
    callback = options
    options = undefined
  }
  if (isDotenvPath(file)) return process.nextTick(callback, null, emptyResult(options))
  return originalRead.call(this, file, options, callback)
}

fs.promises.readFile = async function readFile(file, options) {
  if (isDotenvPath(file)) return emptyResult(options)
  return originalPromiseRead.call(this, file, options)
}

moduleApi.syncBuiltinESMExports()
