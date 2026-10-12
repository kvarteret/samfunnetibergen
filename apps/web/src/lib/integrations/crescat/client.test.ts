import { afterEach, describe, expect, test, vi } from "vitest"

import { postEventRequest } from "./client"
import type { EventRequestBody } from "./types"

const body = {} as EventRequestBody

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("postEventRequest URL allowlist", () => {
  test("rejects an unknown slug before making a request", async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    const result = await postEventRequest("https://attacker.example", body)

    expect(result).toEqual({ ok: false, error: "Ugyldig bookingskjema." })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test("uses the constant Crescat URL for an allowed slug", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response("", {
          status: 200,
          headers: [
            ["set-cookie", "XSRF-TOKEN=token; Path=/"],
            ["set-cookie", "crescat_session=session; Path=/"],
          ],
        }),
      )
      .mockResolvedValueOnce(new Response("", { status: 201 }))
    vi.stubGlobal("fetch", fetchMock)

    const result = await postEventRequest(
      "studentersamfunnet-i-bergen-booking-av-karoke",
      body,
    )

    expect(result).toEqual({ ok: true, value: 201 })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://app.crescat.io/event-requests/studentersamfunnet-i-bergen-booking-av-karoke",
    )
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      "https://app.crescat.io/event-requests/studentersamfunnet-i-bergen-booking-av-karoke",
    )
  })
})

describe("postEventRequest timeouts", () => {
  test("bounds both the session GET and the submit POST", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response("", {
          status: 200,
          headers: [
            ["set-cookie", "XSRF-TOKEN=token; Path=/"],
            ["set-cookie", "crescat_session=session; Path=/"],
          ],
        }),
      )
      .mockResolvedValueOnce(new Response("", { status: 201 }))
    vi.stubGlobal("fetch", fetchMock)

    await postEventRequest(
      "studentersamfunnet-i-bergen-booking-av-karoke",
      body,
    )

    for (const call of fetchMock.mock.calls) {
      expect(call[1]?.signal).toBeInstanceOf(AbortSignal)
    }
  })

  test("propagates a timeout so the action can classify it", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockRejectedValue(
          new DOMException("The operation timed out.", "TimeoutError"),
        ),
    )

    await expect(
      postEventRequest("studentersamfunnet-i-bergen-booking-av-karoke", body),
    ).rejects.toMatchObject({ name: "TimeoutError" })
  })
})
