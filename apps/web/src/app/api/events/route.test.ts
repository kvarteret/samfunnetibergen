import { describe, expect, test, vi } from "vitest"

const { submitEventMock } = vi.hoisted(() => ({
  submitEventMock: vi.fn(),
}))

vi.mock("@/features/events/actions/submitEvent", () => ({
  submitEvent: submitEventMock,
}))

import { POST } from "./route"

function eventRequest(init?: { origin?: string; body?: string }): Request {
  const headers: Record<string, string> = { "content-type": "application/json" }
  if (init?.origin !== undefined) headers.origin = init.origin
  return new Request("https://www.samfunnetibergen.no/api/events", {
    method: "POST",
    headers,
    body: init?.body ?? JSON.stringify({ title: "Testarrangement" }),
  })
}

describe("POST /api/events", () => {
  test("rejects a cross-origin request before delegating", async () => {
    submitEventMock.mockClear()

    const response = await POST(
      eventRequest({ origin: "https://evil.example.com" }),
    )

    expect(response.status).toBe(403)
    expect(submitEventMock).not.toHaveBeenCalled()
  })

  test("accepts a same-origin request and returns the Result", async () => {
    submitEventMock.mockReset().mockResolvedValue({ ok: true, value: "doc-1" })

    const response = await POST(
      eventRequest({ origin: "https://www.samfunnetibergen.no" }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true, value: "doc-1" })
    expect(submitEventMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Testarrangement" }),
    )
  })

  test("rejects a malformed JSON body", async () => {
    submitEventMock.mockClear()

    const response = await POST(
      eventRequest({
        origin: "https://www.samfunnetibergen.no",
        body: "not json",
      }),
    )

    expect(response.status).toBe(400)
    expect(submitEventMock).not.toHaveBeenCalled()
  })
})
