import { describe, expect, it } from "vitest"
import { buildOperationalAttributes } from "./observability"

describe("operational observability", () => {
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
