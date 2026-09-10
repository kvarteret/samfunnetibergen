export function remoteWritesDisabled(): boolean {
  return (
    process.env.KVARTERET_DISABLE_REMOTE_WRITES === "1" ||
    process.env.KVARTERET_OFFLINE_SUBMISSIONS === "1"
  )
}
