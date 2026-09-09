import { describe, expect, test, vi } from "vitest"

import { formPost, jsonGet, jsonPost } from "./route-helpers"

function request(
  init: {
    method?: string
    origin?: string
    contentType?: string
    body?: BodyInit
  } = {},
): Request {
  const headers: Record<string, string> = {}
  if (init.contentType) headers["content-type"] = init.contentType
  if (init.origin !== undefined) headers.origin = init.origin
  return new Request("https://www.samfunnetibergen.no/api/test", {
    method: init.method ?? "POST",
    headers,
    body: init.body,
  })
}

describe("jsonPost", () => {
  test("rejects a cross-origin request before invoking the handler", async () => {
    const handler = vi.fn()

    const response = await jsonPost(
      request({ origin: "https://evil.example.com" }),
      handler,
    )

    expect(response.status).toBe(403)
    expect(handler).not.toHaveBeenCalled()
  })

  test("rejects a malformed JSON body", async () => {
    const handler = vi.fn()

    const response = await jsonPost(
      request({ contentType: "application/json", body: "not json" }),
      handler,
    )

    expect(response.status).toBe(400)
    expect(handler).not.toHaveBeenCalled()
  })

  test("rejects a non-object JSON body", async () => {
    const handler = vi.fn()

    const response = await jsonPost(
      request({ contentType: "application/json", body: '"a string"' }),
      handler,
    )

    expect(response.status).toBe(400)
    expect(handler).not.toHaveBeenCalled()
  })

  test("invokes the handler with the parsed body and returns its result", async () => {
    const handler = vi.fn().mockResolvedValue({ ok: true, value: 201 })

    const response = await jsonPost(
      request({
        origin: "https://www.samfunnetibergen.no",
        contentType: "application/json",
        body: JSON.stringify({ eventName: "Test" }),
      }),
      handler,
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true, value: 201 })
    expect(handler).toHaveBeenCalledWith({ eventName: "Test" })
  })

  test("allows a request without an Origin header (non-browser caller)", async () => {
    const handler = vi.fn().mockResolvedValue({ ok: true, value: 1 })

    const response = await jsonPost(
      request({ contentType: "application/json", body: "{}" }),
      handler,
    )

    expect(response.status).toBe(200)
    expect(handler).toHaveBeenCalled()
  })
})

describe("formPost", () => {
  test("invokes the handler with the parsed form data", async () => {
    const handler = vi.fn().mockResolvedValue({ ok: true, value: "image-1" })
    const formData = new FormData()
    formData.append(
      "image",
      new File(["x"], "photo.png", { type: "image/png" }),
    )

    const response = await formPost(
      request({ origin: "https://www.samfunnetibergen.no", body: formData }),
      handler,
    )

    expect(response.status).toBe(200)
    expect(handler).toHaveBeenCalledOnce()
  })
})

describe("jsonGet", () => {
  test("returns the loaded data", async () => {
    const response = await jsonGet(() => Promise.resolve([1, 2]), "failed")

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual([1, 2])
  })

  test("returns the error detail with status 500 on failure", async () => {
    const response = await jsonGet(
      () => Promise.reject(new Error("boom")),
      "Failed to load",
    )

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ detail: "Failed to load" })
  })
})
