import { beforeEach, describe, expect, test, vi } from "vitest"

const {
  captureSubmitFailureMock,
  createClientMock,
  createMock,
  posthogCaptureMock,
  rateLimitMock,
} = vi.hoisted(() => {
  process.env.SANITY_WRITE_TOKEN = "test-token"
  return {
    captureSubmitFailureMock: vi.fn(),
    createClientMock: vi.fn(),
    createMock: vi.fn(),
    posthogCaptureMock: vi.fn(),
    rateLimitMock: vi.fn().mockResolvedValue(false),
  }
})

vi.mock("@sanity/client", () => ({
  createClient: createClientMock,
}))

vi.mock("@/lib/posthog-server", () => ({
  getPostHogClient: () => ({ capture: posthogCaptureMock }),
}))

vi.mock("@/lib/submission", () => ({
  captureSubmitFailure: captureSubmitFailureMock,
  getValidationDiagnostics: vi.fn(),
  GENERIC_SUBMIT_ERROR: "Noe gikk galt. Prøv igjen senere.",
  INVALID_PAYLOAD_ERROR:
    "Skjemaet er ufullstendig eller inneholder ugyldige verdier.",
  isSubmissionRateLimited: rateLimitMock,
  RATE_LIMIT_ERROR: "For mange forsøk. Vent litt og prøv igjen.",
}))

import { initialState } from "../domain/formState"
import { submitEvent } from "./submitEvent"

describe("submitEvent", () => {
  beforeEach(() => {
    createMock.mockReset()
    createMock.mockResolvedValue({ _id: "arrangement-123" })
    createClientMock.mockReset()
    createClientMock.mockReturnValue({ create: createMock })
    posthogCaptureMock.mockReset()
    rateLimitMock.mockReset()
    rateLimitMock.mockResolvedValue(false)
  })

  test("does not persist blank optional date rows", async () => {
    const result = await submitEvent({
      ...initialState,
      title: "Testarrangement",
      dates: [
        {
          ...initialState.dates[0],
          startDate: "2026-08-20",
          startTime: "19:00",
        },
        {
          ...initialState.dates[0],
          id: "blank-date",
          startDate: "",
          startTime: "",
          endTime: "",
        },
      ],
      submittedBy: "Kari Nordmann",
      submittedByEmail: "kari@example.com",
    })

    expect(result).toEqual({ ok: true, value: "arrangement-123" })
    expect(createMock).toHaveBeenCalledOnce()

    const document = createMock.mock.calls[0]?.[0] as {
      dates: Array<{ startDate: string }>
    }
    expect(document.dates).toHaveLength(1)
    expect(document.dates[0]).toMatchObject({ startDate: "2026-08-20" })
  })
})
