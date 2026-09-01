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
      titleEnglish: "Test event",
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
    expect(posthogCaptureMock).not.toHaveBeenCalled()

    const document = createMock.mock.calls[0]?.[0] as {
      dates: Array<{ startDate: string }>
    }
    expect(document.dates).toHaveLength(1)
    expect(document.dates[0]).toMatchObject({ startDate: "2026-08-20" })
  })

  test("rejects a submission without an English title", async () => {
    const result = await submitEvent({
      ...initialState,
      title: "Testarrangement",
      titleEnglish: "",
      dates: [
        {
          ...initialState.dates[0],
          startDate: "2026-08-20",
          startTime: "19:00",
        },
      ],
      submittedBy: "Kari Nordmann",
      submittedByEmail: "kari@example.com",
    })

    expect(result).toEqual({
      ok: false,
      error: "Skjemaet er ufullstendig eller inneholder ugyldige verdier.",
    })
    expect(createMock).not.toHaveBeenCalled()
  })

  test("persists explicit English translations in canonical locales", async () => {
    const result = await submitEvent({
      ...initialState,
      title: "Testarrangement",
      titleEnglish: "Test event",
      description: "Dette skjer på Kvarteret.",
      descriptionEnglish: "This is happening at Kvarteret.",
      roomText: "Uteområdet",
      roomTextEnglish: "Outdoor area",
      organizerText: "Studentforeningen",
      organizerTextEnglish: "Student organization",
      dates: [
        {
          ...initialState.dates[0],
          startDate: "2026-08-20",
          startTime: "19:00",
        },
      ],
      submittedBy: "Kari Nordmann",
      submittedByEmail: "kari@example.com",
    })

    expect(result).toEqual({ ok: true, value: "arrangement-123" })
    const document = createMock.mock.calls[0]?.[0] as {
      localizedTitle: Array<{ language: string; value: string }>
      localizedDescription: Array<{ language: string; value: unknown }>
      localizedRoomText: Array<{ language: string; value: string }>
      localizedOrganizerText: Array<{ language: string; value: string }>
    }

    expect(document.localizedTitle).toEqual([
      expect.objectContaining({
        _type: "internationalizedArrayStringValue",
        language: "nb",
        value: "Testarrangement",
      }),
      expect.objectContaining({
        _type: "internationalizedArrayStringValue",
        language: "en",
        value: "Test event",
      }),
    ])
    expect(document.localizedDescription).toHaveLength(2)
    expect(document.localizedDescription[0]?.language).toBe("nb")
    expect(document.localizedDescription[1]?.language).toBe("en")
    expect(document.localizedDescription[1]?.value).not.toEqual(
      document.localizedDescription[0]?.value,
    )
    expect(document.localizedRoomText).toEqual([
      expect.objectContaining({ language: "nb", value: "Uteområdet" }),
      expect.objectContaining({ language: "en", value: "Outdoor area" }),
    ])
    expect(document.localizedOrganizerText).toEqual([
      expect.objectContaining({
        language: "nb",
        value: "Studentforeningen",
      }),
      expect.objectContaining({
        language: "en",
        value: "Student organization",
      }),
    ])
  })
})
