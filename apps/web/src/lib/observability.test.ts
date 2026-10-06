import { describe, expect, it, vi } from "vitest"
import {
  buildOperationalAttributes,
  emitOperationalEvent,
} from "./observability"

const { emit } = vi.hoisted(() => ({ emit: vi.fn() }))
vi.mock("@opentelemetry/api-logs", async importOriginal => {
  const original =
    await importOriginal<typeof import("@opentelemetry/api-logs")>()
  return { ...original, logs: { getLogger: () => ({ emit }) } }
})

describe("operational observability", () => {
  it("classifies domain failures and rejections above routine outcomes", () => {
    for (const [event, severityText, severityNumber] of [
      ["booking.submitted", "INFO", 9],
      ["booking.rejected", "WARN", 13],
      ["booking.failed", "ERROR", 17],
    ] as const) {
      emitOperationalEvent(event, { booking_submission_id: "submission-123" })
      expect(emit).toHaveBeenLastCalledWith(
        expect.objectContaining({
          body: event,
          severityText,
          severityNumber,
          attributes: expect.objectContaining({
            booking_submission_id: "submission-123",
          }),
        }),
      )
    }
  })

  it("keeps only allowlisted scalar fields and redacts sensitive values", () => {
    const attributes = buildOperationalAttributes("submission.completed", {
      registration_id: 42,
      outcome: "accepted",
      error_category: "sentinel@example.com",
      unknown: "Bearer top-secret",
    })

    expect(attributes).toMatchObject({
      event: "submission.completed",
      registration_id: 42,
      outcome: "accepted",
      error_category: "[redacted]",
    })
    expect(attributes).not.toHaveProperty("unknown")
    expect(JSON.stringify(attributes)).not.toContain("sentinel@example.com")
    expect(JSON.stringify(attributes)).not.toContain("top-secret")
  })

  it("redacts token-bearing paths even in an allowlisted field", () => {
    const attributes = buildOperationalAttributes("submission.failed", {
      error_category: "/apply/sentinel-secret-token?email=user@example.com",
    })

    expect(attributes.error_category).toBe("[redacted]")
  })
})
