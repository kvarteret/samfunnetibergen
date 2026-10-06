import { describe, expect, it } from "vitest"
import { prepareBrowserLog } from "./log-policy"

describe("browser operational logs", () => {
  it("drops routine console output and toolbar failures", () => {
    expect(
      prepareBrowserLog({ body: "<SanityLive> connected", level: "info" }),
    ).toBeNull()
    expect(
      prepareBrowserLog({
        body: "[PostHog Toolbar][api] Request failed",
        level: "error",
      }),
    ).toBeNull()
  })

  it("retains dependency failures without raw console data", () => {
    const result = prepareBrowserLog({
      body: "<SanityLive> reconnecting https://example.com?token=secret person@example.com",
      level: "error",
      attributes: { "log.source": "console.error", password: "secret" },
    })
    expect(result).toEqual({
      body: "content.live_connection.failed",
      level: "error",
      attributes: { dependency: "sanity", "log.source": "console.error" },
    })
  })

  it("preserves severity and trace context for application failures", () => {
    expect(
      prepareBrowserLog({
        body: "TypeError: failed with sensitive input",
        level: "fatal",
        trace_id: "a".repeat(32),
        span_id: "b".repeat(16),
      }),
    ).toEqual({
      body: "browser.runtime.failed",
      level: "fatal",
      trace_id: "a".repeat(32),
      span_id: "b".repeat(16),
      attributes: { error_type: "TypeError" },
    })
  })
})
