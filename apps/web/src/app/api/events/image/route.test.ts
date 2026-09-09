import { describe, expect, test, vi } from "vitest"

const { uploadEventImageMock } = vi.hoisted(() => ({
  uploadEventImageMock: vi.fn(),
}))

vi.mock("@/features/events/actions/submitEvent", () => ({
  uploadEventImage: uploadEventImageMock,
}))

import { POST } from "./route"

function imageRequest(init?: {
  origin?: string
  formData?: FormData
}): Request {
  const headers: Record<string, string> = {}
  if (init?.origin !== undefined) headers.origin = init.origin
  const formData = init?.formData ?? new FormData()
  if (!init?.formData) {
    formData.append(
      "image",
      new File(["x"], "photo.png", { type: "image/png" }),
    )
  }
  return new Request("https://www.samfunnetibergen.no/api/events/image", {
    method: "POST",
    headers,
    body: formData,
  })
}

describe("POST /api/events/image", () => {
  test("rejects a cross-origin request before delegating", async () => {
    uploadEventImageMock.mockClear()

    const response = await POST(
      imageRequest({ origin: "https://evil.example.com" }),
    )

    expect(response.status).toBe(403)
    expect(uploadEventImageMock).not.toHaveBeenCalled()
  })

  test("accepts a same-origin request and returns the Result", async () => {
    uploadEventImageMock
      .mockReset()
      .mockResolvedValue({ ok: true, value: "image-1" })

    const response = await POST(
      imageRequest({ origin: "https://www.samfunnetibergen.no" }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      value: "image-1",
    })
    expect(uploadEventImageMock).toHaveBeenCalledOnce()
    const formData = uploadEventImageMock.mock.calls[0][0] as FormData
    const file = formData.get("image")
    expect(file).toBeInstanceOf(File)
    expect((file as File).name).toBe("photo.png")
  })
})
