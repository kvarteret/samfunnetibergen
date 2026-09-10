import { beforeEach, describe, expect, it, vi } from "vitest"
import { browserOwnsBookingConversion } from "./analytics-ownership"

const mocks = vi.hoisted(() => ({
  after: [] as Array<() => Promise<void>>,
  capture: vi.fn().mockResolvedValue(undefined),
  emit: vi.fn(),
  cookie: undefined as string | undefined,
  getCookie: vi.fn(),
}))
vi.mock("next/server", () => ({
  after: (callback: () => Promise<void>) => mocks.after.push(callback),
}))
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      mocks.getCookie(name)
      return mocks.cookie ? { value: mocks.cookie } : undefined
    },
  }),
}))
vi.mock("@/lib/posthog-server", () => ({
  getBookingPostHogClient: () => ({ captureImmediate: mocks.capture }),
}))
vi.mock("@/lib/observability", async importOriginal => ({
  ...(await importOriginal<typeof import("@/lib/observability")>()),
  emitOperationalEvent: mocks.emit,
}))
import {
  emitBookingOutcome,
  parseBookingIdentity,
  resolveBookingAnalyticsOwner,
} from "./telemetry"

const submission = "e8358a4d-05c7-4282-874c-26dcad007042"
beforeEach(() => {
  mocks.after.length = 0
  mocks.cookie = undefined
  mocks.capture.mockReset().mockResolvedValue(undefined)
  mocks.emit.mockReset()
  vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "phc_test")
  vi.stubEnv("BOOKING_ANALYTICS_OWNERSHIP", "legacy")
})

describe("conversion ownership", () => {
  it.each([
    undefined,
    "legacy",
    "server",
    "disabled",
  ] as const)("browser obeys %s including an old server", owner => {
    expect(browserOwnsBookingConversion({ analytics_owner: owner })).toBe(
      owner === undefined || owner === "legacy",
    )
  })
  it("defaults to legacy and supports emergency disable", () => {
    expect(resolveBookingAnalyticsOwner()).toBe("legacy")
    vi.stubEnv("BOOKING_ANALYTICS_OWNERSHIP", "disabled")
    expect(resolveBookingAnalyticsOwner()).toBe("disabled")
  })
  it.each([
    "room",
    "karaoke",
  ] as const)("defers %s capture and preserves occurrence identity", async bookingKind => {
    const id = await emitBookingOutcome({
      bookingKind,
      outcome: "accepted",
      bookingSubmissionId: submission,
      providerHttpStatus: 201,
      analyticsOwner: "server",
    })
    expect(mocks.capture).not.toHaveBeenCalled()
    await mocks.after[0]()
    expect(mocks.getCookie).toHaveBeenCalledWith("ph_phc_test_posthog")
    const record = mocks.capture.mock.calls[0][0]
    expect(record).toMatchObject({
      uuid: id,
      event: `${bookingKind === "room" ? "room" : "karaoke"}_booking_submitted`,
      distinctId: "anonymous",
      properties: {
        domain_event_id: id,
        identity_scope: "aggregate",
        booking_submission_id: submission,
        source: "server",
        schema_version: 1,
      },
    })
    expect(record.timestamp.toISOString()).toBe(
      mocks.emit.mock.calls[0][1].occurred_at,
    )
    await mocks.after[0]()
    expect(mocks.capture.mock.calls[1][0].uuid).toBe(id)
  })
  it.each([
    "legacy",
    "disabled",
  ] as const)("does not schedule server capture in %s", async analyticsOwner => {
    await emitBookingOutcome({
      bookingKind: "room",
      outcome: "accepted",
      bookingSubmissionId: submission,
      providerHttpStatus: 201,
      analyticsOwner,
    })
    expect(mocks.after).toHaveLength(0)
  })
  it.each([
    "rejected",
    "failed",
    "outcome_unknown",
  ] as const)("never converts %s", async outcome => {
    await emitBookingOutcome({
      bookingKind: "karaoke",
      outcome,
      bookingSubmissionId: submission,
      analyticsOwner: "server",
    })
    expect(mocks.after).toHaveLength(0)
  })
  it("isolates log and analytics failures", async () => {
    mocks.emit.mockImplementation(() => {
      throw new Error("log sink")
    })
    mocks.capture.mockRejectedValue(new Error("analytics sink"))
    await emitBookingOutcome({
      bookingKind: "room",
      outcome: "accepted",
      bookingSubmissionId: submission,
      providerHttpStatus: 200,
      analyticsOwner: "server",
    })
    await expect(mocks.after[0]()).resolves.toBeUndefined()
    expect(mocks.capture).toHaveBeenCalledOnce()
  })
  it("rejects invalid occurrences before either sink", async () => {
    await emitBookingOutcome({
      bookingKind: "room",
      outcome: "accepted",
      bookingSubmissionId: submission,
      providerHttpStatus: Number.NaN,
      analyticsOwner: "server",
    })
    expect(mocks.emit).not.toHaveBeenCalled()
    expect(mocks.after).toHaveLength(0)
  })
  it("only accepts pseudonymous UUIDs and never raw cookie data", () => {
    expect(
      parseBookingIdentity(JSON.stringify({ distinct_id: submission })),
    ).toEqual({ distinctId: submission, identityScope: "pseudonymous" })
    for (const raw of [
      "{",
      "x".repeat(9000),
      JSON.stringify({ distinct_id: "Jane Smith" }),
      JSON.stringify({ distinct_id: "test@example.com" }),
    ]) {
      expect(parseBookingIdentity(raw)).toEqual({
        distinctId: "anonymous",
        identityScope: "aggregate",
      })
    }
  })
})
