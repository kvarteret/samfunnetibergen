import type { CaptureLogOptions } from "posthog-js"

export function normalizeBrowserLog(record: CaptureLogOptions): CaptureLogOptions {
  let body = record.body
  try {
    const decoded: unknown = JSON.parse(body)
    if (typeof decoded === "string") body = decoded
  } catch { /* Console text need not be JSON. */ }
  body = body
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted-email]")
    .replace(/\bbearer\s+[^\s"']+/gi, "Bearer [redacted]")
    .replace(/(\/(?:apply|set-password)\/)[^/?#\s"']+/gi, "$1[redacted]")
    .replace(/\?[^\s"']*/g, "?[redacted]")
  const sanityState = body.includes("<SanityLive>")
    ? body.includes("attempting to reconnect") ? "reconnecting"
      : body.includes("connected and listening") ? "connected" : undefined
    : undefined
  return {
    ...record,
    body: sanityState ? "sanity.live.connection" : body,
    attributes: {
      ...record.attributes,
      "app.name": "samfunnetibergen",
      ...(sanityState ? { event: "sanity.live.connection", "connection.state": sanityState } : {}),
    },
  }
}
