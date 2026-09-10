import { describe, expect, it } from "vitest"
import {
  buildOperationalAttributes,
  diagnosticCounts,
  emitOperationalEvent,
} from "./observability"

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

  it("preserves approved provider status fields", () => {
    const attributes = buildOperationalAttributes("booking.request.accepted", {
      booking_kind: "room",
      provider_http_status: 201,
    })

    expect(attributes).toMatchObject({
      booking_kind: "room",
      provider_http_status: 201,
    })
  })

  it("drops invalid operational events and records a bounded diagnostic", () => {
    const before = diagnosticCounts().invalid_field ?? 0

    emitOperationalEvent("booking.request.accepted", {
      booking_kind: "room",
      unknown_field: "must not reach a sink",
    })

    expect(diagnosticCounts().invalid_field).toBeGreaterThan(before)
  })
})

import fixture from "./observability-contract.fixture.json"
import { prepareOperationalEvent } from "./observability"

it("executes shared envelope and redaction fixtures", () => {
  const prepared = prepareOperationalEvent("booking.request.accepted", {
    booking_kind: "room",
    booking_submission_id: "a1e856b8-4535-4b85-8750-624ad7f68f43",
    provider_http_status: 201,
  })!
  const payload: Record<string, unknown> = {
    ...prepared.fields,
    event: prepared.event,
    message: "Room booking request accepted by Crescat",
  }
  for (const key of fixture.envelope) expect(payload).toHaveProperty(key)
  expect(payload.schema_version).toBe(fixture.schema_version)
  for (const value of fixture.redaction_sentinels) {
    expect(
      JSON.stringify(
        buildOperationalAttributes("feedback.forward.failed", {
          error_category: value,
        }),
      ),
    ).not.toContain(value)
  }
  for (const key of fixture.forbidden_fields) {
    expect(
      buildOperationalAttributes("feedback.forward.failed", {
        [key]: "private",
      }),
    ).not.toHaveProperty(key)
  }
})

it.each([
  {},
  {
    booking_kind: "room",
    booking_submission_id: "id",
    provider_http_status: Number.NaN,
  },
  {
    booking_kind: "room",
    booking_submission_id: "id",
    provider_http_status: 201,
    outcome: "failure",
  },
  {
    booking_kind: "room",
    booking_submission_id: "id",
    provider_http_status: 201,
    service: "forged",
  },
])("rejects missing, mistyped and forged occurrence fields", fields => {
  expect(prepareOperationalEvent("booking.request.accepted", fields)).toBeNull()
})
