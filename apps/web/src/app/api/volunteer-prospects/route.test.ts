import { beforeEach, describe, expect, it, vi } from "vitest"

const {
  captureMock,
  emitOperationalEventMock,
  fetchMock,
  posthogCaptureMock,
  rateLimitMock,
} = vi.hoisted(() => ({
  captureMock: vi.fn(),
  emitOperationalEventMock: vi.fn(),
  fetchMock: vi.fn(),
  posthogCaptureMock: vi.fn(),
  rateLimitMock: vi.fn().mockResolvedValue(false),
}))

vi.stubGlobal("fetch", fetchMock)

vi.mock("@/lib/submission", () => ({
  captureSubmitFailure: captureMock,
  getValidationDiagnostics: vi.fn().mockReturnValue({
    issue_count: 1,
    field_paths: "email",
    issue_codes: "invalid_string",
  }),
  isSubmissionRateLimited: rateLimitMock,
  RATE_LIMIT_ERROR: "For mange forsøk.",
}))

vi.mock("@/lib/posthog-server", () => ({
  getPostHogClient: () => ({ capture: posthogCaptureMock }),
}))

vi.mock("@/lib/observability", () => ({
  currentTraceFields: () => ({
    trace_id: "0123456789abcdef0123456789abcdef",
    span_id: "0123456789abcdef",
  }),
  emitOperationalEvent: emitOperationalEventMock,
  injectActiveTraceContext: (headers: Record<string, string>) => {
    headers.traceparent =
      "00-0123456789abcdef0123456789abcdef-0123456789abcdef-01"
    headers.tracestate = "vendor=test"
  },
}))

import { POST } from "./route"

const validPayload = {
  firstName: "Kari",
  lastName: "Nordmann",
  email: "kari@example.com",
  phone: "+4740612345",
  studyInstitution: "UiB",
  firstChoiceGroupSlug: "kraftetaten",
  secondChoiceGroupSlug: "",
  backgroundDetails: "",
  friendEmails: [],
}

describe("POST /api/volunteer-prospects", () => {
  beforeEach(() => {
    captureMock.mockReset()
    emitOperationalEventMock.mockReset()
    fetchMock.mockReset()
    posthogCaptureMock.mockReset()
    rateLimitMock.mockReset()
    rateLimitMock.mockResolvedValue(false)
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
      phone: "+4740612345",
    })
    expect(requestInit.headers).toMatchObject({
      traceparent: "00-0123456789abcdef0123456789abcdef-0123456789abcdef-01",
      tracestate: "vendor=test",
    })
    expect(posthogCaptureMock).toHaveBeenCalledWith(
      expect.objectContaining({
        properties: expect.objectContaining({
          $process_person_profile: false,
          registration_id: 42,
          trace_id: "0123456789abcdef0123456789abcdef",
        }),
      }),
    )
    expect(emitOperationalEventMock).toHaveBeenCalledWith(
      "volunteer.application.submitted",
      expect.objectContaining({
        registration_id: 42,
        outcome: "accepted",
      }),
    )
  })

  it("forwards valid submissions without checking the local rate limiter", async () => {
    rateLimitMock.mockResolvedValue(true)
    fetchMock.mockResolvedValue(
      Response.json({ registrationId: 44 }, { status: 201 }),
    )

    const response = await POST(
      new Request("http://localhost/api/volunteer-prospects", {
        method: "POST",
        body: JSON.stringify(validPayload),
      }),
    )

    expect(response.status).toBe(201)
    expect(rateLimitMock).not.toHaveBeenCalled()
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it("rejects invalid input before forwarding to Personal", async () => {
    const response = await POST(
      new Request("http://localhost/api/volunteer-prospects", {
        method: "POST",
        body: JSON.stringify({ ...validPayload, email: "not-an-email" }),
      }),
    )

    expect(response.status).toBe(400)
    expect(rateLimitMock).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
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
          firstChoiceGroupSlug: "grondahls",
          secondChoiceGroupSlug: "halvtimen",
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

  it("does not include the applicant email when Personal rejects the submission", async () => {
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
      }),
    )
    const capturedProperties = captureMock.mock.calls[0]?.[2]
    expect(capturedProperties).not.toHaveProperty("email")
    expect(JSON.stringify(capturedProperties)).not.toContain("kari@example.com")
  })

  it("returns expected Personal conflicts without reporting an exception", async () => {
    fetchMock.mockResolvedValue(
      Response.json(
        { detail: "En aktiv søknad med denne e-postadressen finnes allerede." },
        { status: 409 },
      ),
    )

    const response = await POST(
      new Request("http://localhost/api/volunteer-prospects", {
        method: "POST",
        body: JSON.stringify(validPayload),
      }),
    )

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({
      detail: "En aktiv søknad med denne e-postadressen finnes allerede.",
    })
    expect(captureMock).not.toHaveBeenCalled()
  })

  it("does not include the applicant email when forwarding fails", async () => {
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
      }),
    )
    const capturedProperties = captureMock.mock.calls[0]?.[2]
    expect(capturedProperties).not.toHaveProperty("email")
    expect(JSON.stringify(capturedProperties)).not.toContain("kari@example.com")
  })
})
