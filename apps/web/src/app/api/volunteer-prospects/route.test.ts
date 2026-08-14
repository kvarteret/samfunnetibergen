import { beforeEach, describe, expect, it, vi } from "vitest"

const HMAC_SECRET = "test-shared-secret-0123456789abcdef"
const CLIENT_KEY_SECRET = "test-client-key-secret-0123456789abcdef"
const CLIENT_IP = "203.0.113.42"
const FIXED_IDEMPOTENCY_KEY = "123e4567-e89b-42d3-a456-426614174001"
const EXPECTED_CLIENT_KEY =
  "v1=9a0dcfcc46f5fc85d1151d64c99635e5d32febbe873c1d9467cf618652eb84e5"

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

function volunteerRequest(
  body: BodyInit = JSON.stringify(validPayload),
  headers: HeadersInit = {},
): Request {
  return new Request("http://localhost/api/volunteer-prospects", {
    method: "POST",
    headers: {
      "x-forwarded-for": CLIENT_IP,
      ...Object.fromEntries(new Headers(headers)),
    },
    body,
  })
}

describe("POST /api/volunteer-prospects", () => {
  beforeEach(() => {
    process.env.VOLUNTEER_PROSPECT_HMAC_SECRET = HMAC_SECRET
    process.env.VOLUNTEER_PROSPECT_CLIENT_KEY_SECRET = CLIENT_KEY_SECRET
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

    const response = await POST(volunteerRequest())

    expect(response.status).toBe(201)
    expect(fetchMock).toHaveBeenCalledOnce()
    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(JSON.parse(requestInit.body as string)).toMatchObject({
      first_choice_group_slug: "kraftetaten",
      phone: "+4740612345",
    })
    expect(requestInit.headers).toMatchObject({
      "X-Kvarteret-Timestamp": expect.stringMatching(/^\d+$/),
      "X-Kvarteret-Nonce": expect.stringMatching(/^[0-9a-f-]{36}$/),
      "X-Kvarteret-Idempotency-Key": expect.stringMatching(/^[0-9a-f-]{36}$/),
      "X-Kvarteret-Client-Key": EXPECTED_CLIENT_KEY,
      "X-Kvarteret-Signature": expect.stringMatching(/^v2=[0-9a-f]{64}$/),
      traceparent: "00-0123456789abcdef0123456789abcdef-0123456789abcdef-01",
      tracestate: "vendor=test",
    })
    expect(JSON.stringify(requestInit.headers)).not.toContain(CLIENT_IP)
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

    const response = await POST(volunteerRequest())

    expect(response.status).toBe(201)
    expect(rateLimitMock).not.toHaveBeenCalled()
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it("preserves a canonical idempotency key supplied by the browser", async () => {
    fetchMock.mockResolvedValue(
      Response.json({ registrationId: 45 }, { status: 201 }),
    )

    const response = await POST(
      volunteerRequest(JSON.stringify(validPayload), {
        "X-Kvarteret-Idempotency-Key": FIXED_IDEMPOTENCY_KEY,
      }),
    )

    expect(response.status).toBe(201)
    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(requestInit.headers).toMatchObject({
      "X-Kvarteret-Idempotency-Key": FIXED_IDEMPOTENCY_KEY,
      "X-Kvarteret-Signature": expect.stringMatching(/^v2=[0-9a-f]{64}$/),
    })
  })

  it("rejects a malformed idempotency key before forwarding", async () => {
    const response = await POST(
      volunteerRequest(JSON.stringify(validPayload), {
        "X-Kvarteret-Idempotency-Key": "NOT-A-CANONICAL-UUID",
      }),
    )

    expect(response.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("rejects a streamed body above 16 KiB before JSON parsing", async () => {
    const oversizedMalformedJson = `"${" ".repeat(16_383)}"`

    const response = await POST(volunteerRequest(oversizedMalformedJson))

    expect(new TextEncoder().encode(oversizedMalformedJson)).toHaveLength(
      16_385,
    )
    expect(response.status).toBe(413)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(captureMock).not.toHaveBeenCalled()
  })

  it("allows exactly 16 KiB through to JSON and schema validation", async () => {
    const bodyAtLimit = `"${" ".repeat(16_382)}"`

    const response = await POST(volunteerRequest(bodyAtLimit))

    expect(new TextEncoder().encode(bodyAtLimit)).toHaveLength(16_384)
    expect(response.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(captureMock).toHaveBeenCalledWith(
      "volunteer_application",
      expect.any(Error),
      expect.objectContaining({ failure_branch: "schema_validation_failed" }),
    )
  })

  it("rejects a declared oversized body without reading or parsing it", async () => {
    const response = await POST(
      volunteerRequest("not-json", { "content-length": "16385" }),
    )

    expect(response.status).toBe(413)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(captureMock).not.toHaveBeenCalled()
  })

  it("enforces bounded form fields on the server", async () => {
    const response = await POST(
      volunteerRequest(
        JSON.stringify({
          ...validPayload,
          backgroundDetails: "a".repeat(2_001),
        }),
      ),
    )

    expect(response.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("enforces the honeypot bound before silently accepting bot submissions", async () => {
    const response = await POST(
      volunteerRequest(
        JSON.stringify({
          honeypot: "a".repeat(201),
        }),
      ),
    )

    expect(response.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("rejects invalid input before forwarding to Personal", async () => {
    const response = await POST(
      volunteerRequest(
        JSON.stringify({ ...validPayload, email: "not-an-email" }),
      ),
    )

    expect(response.status).toBe(400)
    expect(rateLimitMock).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("fails closed when the HMAC secret is missing", async () => {
    delete process.env.VOLUNTEER_PROSPECT_HMAC_SECRET

    const response = await POST(volunteerRequest())

    expect(response.status).toBe(503)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(captureMock).toHaveBeenCalledWith(
      "volunteer_application",
      expect.any(Error),
      expect.objectContaining({
        failure_branch: "hmac_configuration_invalid",
      }),
    )
  })

  it("fails closed when the client-key secret is missing", async () => {
    delete process.env.VOLUNTEER_PROSPECT_CLIENT_KEY_SECRET

    const response = await POST(volunteerRequest())

    expect(response.status).toBe(503)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(captureMock).toHaveBeenCalledWith(
      "volunteer_application",
      expect.any(Error),
      expect.objectContaining({ failure_branch: "client_key_unavailable" }),
    )
  })

  it("fails closed without a valid trusted client IP and never logs the raw value", async () => {
    const invalidClientIp = "not-an-ip"

    const response = await POST(
      volunteerRequest(JSON.stringify(validPayload), {
        "x-forwarded-for": invalidClientIp,
      }),
    )

    expect(response.status).toBe(503)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(captureMock).toHaveBeenCalledWith(
      "volunteer_application",
      expect.any(Error),
      expect.objectContaining({ failure_branch: "client_key_unavailable" }),
    )
    expect(JSON.stringify(captureMock.mock.calls)).not.toContain(
      invalidClientIp,
    )
  })

  it("forwards groups that were not in the former launch allowlist", async () => {
    fetchMock.mockResolvedValue(
      Response.json({ registrationId: 43 }, { status: 201 }),
    )

    const response = await POST(
      volunteerRequest(
        JSON.stringify({
          ...validPayload,
          firstChoiceGroupSlug: "grondahls",
          secondChoiceGroupSlug: "halvtimen",
        }),
      ),
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

    const response = await POST(volunteerRequest())

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

    const response = await POST(volunteerRequest())

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({
      detail: "En aktiv søknad med denne e-postadressen finnes allerede.",
    })
    expect(captureMock).not.toHaveBeenCalled()
  })

  it("does not include the applicant email when forwarding fails", async () => {
    fetchMock.mockRejectedValue(new Error("Personal unavailable"))

    const response = await POST(volunteerRequest())

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
