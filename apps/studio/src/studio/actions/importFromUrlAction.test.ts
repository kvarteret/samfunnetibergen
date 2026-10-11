import { describe, expect, it, vi } from "vitest"
import { importEndpoint, importFromUrl } from "./importFromUrlAction"

describe("importFromUrl", () => {
  it("creates a private single-use request and returns the website's fields", async () => {
    const client = { create: vi.fn(async (_doc: { _id: string }) => ({})) }
    const fetcher = vi.fn(
      async () =>
        new Response(
          JSON.stringify({ fields: { isFree: true }, missing: ["Velg rom."] }),
        ),
    )
    const result = await importFromUrl(
      client as never,
      "https://example.org/e",
      fetcher,
    )
    const created = client.create.mock.calls[0][0]
    expect(created).toMatchObject({
      _type: "eventImportRequest",
      url: "https://example.org/e",
    })
    expect(created._id).toMatch(/^eventImportRequest\.[a-f0-9-]{36}$/)
    expect(fetcher).toHaveBeenCalledWith(importEndpoint(), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ requestId: created._id.split(".")[1] }),
    })
    expect(result).toEqual({ fields: { isFree: true }, missing: ["Velg rom."] })
  })

  it("surfaces the website's error message", async () => {
    const fetcher = vi.fn(
      async () =>
        new Response(JSON.stringify({ error: "Lenken må være offentlig." }), {
          status: 400,
        }),
    )
    await expect(
      importFromUrl(
        { create: vi.fn(async () => ({})) } as never,
        "https://x.example",
        fetcher,
      ),
    ).rejects.toThrow("Lenken må være offentlig.")
  })
})
