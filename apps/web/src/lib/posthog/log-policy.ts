import type { CaptureLogOptions } from "posthog-js"

/** Apply the operational policy through the SDK's built-in log filter. */
export function prepareBrowserLog(
  record: CaptureLogOptions,
): CaptureLogOptions | null {
  if (!["warn", "error", "fatal"].includes(record.level ?? "info")) return null
  // Toolbar requests belong to PostHog's tooling, not the public application.
  if (record.body.includes("[PostHog Toolbar]")) return null

  const dependency = record.body.includes("<SanityLive>") ? "sanity" : undefined
  const errorType = record.body.match(
    /\b(?:TypeError|ReferenceError|SyntaxError|TimeoutError|Error)\b/,
  )?.[0]
  // Console arguments can contain form input, URLs or credentials. Keep a safe
  // category; exception autocapture separately retains sanitized stack details.
  return {
    ...record,
    body: dependency
      ? "content.live_connection.failed"
      : record.level === "warn"
        ? "browser.runtime.warning"
        : "browser.runtime.failed",
    attributes: {
      ...(dependency ? { dependency } : {}),
      ...(errorType ? { error_type: errorType } : {}),
      ...(typeof record.attributes?.["log.source"] === "string"
        ? { "log.source": record.attributes["log.source"] }
        : {}),
    },
  }
}
