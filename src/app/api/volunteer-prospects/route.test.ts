import { beforeEach, describe, expect, it, vi } from "vitest"

const { captureMock, fetchMock, posthogCaptureMock } = vi.hoisted(() => ({
  captureMock: vi.fn(),
  fetchMock: vi.fn(),
  posthogCaptureMock: vi.fn(),
}))

vi.stubGlobal("fetch", fetchMock)

vi.mock("@/lib/submission", () => ({
  captureSubmitFailure: captureMock,
  isSubmissionRateLimited: vi.fn().mockResolvedValue(false),
  RATE_LIMIT_ERROR: "For mange forsøk.",
}))

vi.mock("@/lib/posthog-server", () => ({
  getPostHogClient: () => ({ capture: posthogCaptureMock }),
}))

import { POST } from "./route"

const validPayload = {
  full_name: "Kari Nordmann",
  email: "kari@example.com",
  phone: "412 34 567",
  study_institution: "UiB",
  first_choice_group_slug: "kraftetaten",
}

describe("POST /api/volunteer-prospects", () => {
  beforeEach(() => {
    captureMock.mockReset()
    fetchMock.mockReset()
    posthogCaptureMock.mockReset()
  })

  it("forwards the Sanity group slug unchanged", async () => {
    fetchMock.mockResolvedValue(
      Response.json({ registrationId: 42 }, { status: 201 }),
    )

    const response = await POST(
      new Request("http://localhost/api/volunteer-prospects", {
        method: "POST",
        body: JSON.stringify(validPayload),
      }),
    )

    expect(response.status).toBe(201)
    expect(fetchMock).toHaveBeenCalledOnce()
    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(JSON.parse(requestInit.body as string)).toMatchObject({
      first_choice_group_slug: "kraftetaten",
    })
  })

  it("forwards groups that were not in the former launch allowlist", async () => {
    fetchMock.mockResolvedValue(
      Response.json({ registrationId: 43 }, { status: 201 }),
    )

    const response = await POST(
      new Request("http://localhost/api/volunteer-prospects", {
        method: "POST",
        body: JSON.stringify({
          ...validPayload,
          first_choice_group_slug: "grondahls",
          second_choice_group_slug: "halvtimen",
        }),
      }),
    )

    expect(response.status).toBe(201)
    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(JSON.parse(requestInit.body as string)).toMatchObject({
      first_choice_group_slug: "grondahls",
      second_choice_group_slug: "halvtimen",
    })
  })

  it("logs the applicant email when Personal rejects the submission", async () => {
    fetchMock.mockResolvedValue(
      Response.json(
        { detail: "Kunne ikke registrere søknaden." },
        { status: 400 },
      ),
    )

    const response = await POST(
      new Request("http://localhost/api/volunteer-prospects", {
        method: "POST",
        body: JSON.stringify(validPayload),
      }),
    )

    expect(response.status).toBe(422)
    expect(captureMock).toHaveBeenCalledWith(
      "volunteer_application",
      expect.any(Error),
      expect.objectContaining({
        failure_branch: "personal_backend_rejected",
        email: "kari@example.com",
      }),
    )
  })

  it("logs the applicant email when forwarding fails", async () => {
    fetchMock.mockRejectedValue(new Error("Personal unavailable"))

    const response = await POST(
      new Request("http://localhost/api/volunteer-prospects", {
        method: "POST",
        body: JSON.stringify(validPayload),
      }),
    )

    expect(response.status).toBe(500)
    expect(captureMock).toHaveBeenCalledWith(
      "volunteer_application",
      expect.any(Error),
      expect.objectContaining({
        failure_branch: "personal_backend_request_failed",
        email: "kari@example.com",
      }),
    )
  })
})
