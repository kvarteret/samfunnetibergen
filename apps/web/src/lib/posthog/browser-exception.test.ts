import type { CaptureResult } from "posthog-js"
import { describe, expect, it } from "vitest"
import { prepareBrowserException } from "./browser-exception"

describe("browser exception diagnostics", () => {
  it("retains Safari-like errors without source URLs and identifies page phase", () => {
    const event = {
      uuid: "test",
      event: "$exception",
      properties: {
        $exception_list: [
          {
            type: "UnavailableError",
            stacktrace: {
              frames: [
                { function: "construct" },
                { filename: "[native code]" },
              ],
            },
          },
        ],
      },
    } as CaptureResult
    const result = prepareBrowserException(
      event,
      "https://example.com/nb/rom/book?email=sentinel@example.com",
      { readyState: "complete", elapsedMs: 7100 },
    )
    expect(result?.properties).toMatchObject({
      error_source: "unattributed",
      workflow: "room_booking",
      page_elapsed_ms: 7100,
      browser_page_phase: "complete",
    })
    expect(result?.properties.exception_frame_sources).toContain("missing:2")
    expect(JSON.stringify(result)).not.toContain("sentinel")
  })
  it("preserves existing document-only filtering", () => {
    const event = {
      uuid: "test",
      event: "$exception",
      properties: {
        $exception_list: [
          {
            stacktrace: {
              frames: [{ filename: "https://example.com/nb/rom/book" }],
            },
          },
        ],
      },
    } as CaptureResult
    expect(
      prepareBrowserException(event, "https://example.com/nb/rom/book"),
    ).toBeNull()
  })
})
