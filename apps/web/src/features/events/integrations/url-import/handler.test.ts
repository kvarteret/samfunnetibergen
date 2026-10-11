import type { SanityClient } from "@sanity/client"
import { describe, expect, test, vi } from "vitest"
import { handleEventImport } from "./handler"
import { UnsafeUrlError } from "./public-fetch"

const requestId = "0f8fad5b-d9cb-469f-a165-70867728950e"
const id = `eventImportRequest.${requestId}`

function setup(document: Record<string, unknown> | undefined) {
  const commit = vi.fn(async () => ({}))
  const client = {
    getDocument: vi.fn(async () => document),
    patch: vi.fn(() => ({
      ifRevisionId: () => ({ set: () => ({ commit }) }),
    })),
    delete: vi.fn(async () => ({})),
  } as unknown as SanityClient
  const importUrl = vi.fn(async () => ({
    fields: { isFree: true },
    missing: [],
  }))
  return { client, importUrl, commit }
}
const fresh = {
  _id: id,
  _rev: "r1",
  _type: "eventImportRequest",
  _createdAt: new Date().toISOString(),
  url: "https://example.org/event",
}
const call = (deps: ReturnType<typeof setup>, body: unknown = { requestId }) =>
  handleEventImport(
    new Request("https://example.test/api/studio/event-import", {
      method: "POST",
      body: JSON.stringify(body),
    }),
    { client: () => deps.client, importUrl: deps.importUrl },
  )

describe("handleEventImport", () => {
  test("imports the URL named by a fresh request and deletes the request", async () => {
    const deps = setup(fresh)
    const response = await call(deps)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      fields: { isFree: true },
      missing: [],
    })
    expect(deps.importUrl).toHaveBeenCalledWith(deps.client, fresh.url)
    expect(deps.commit).toHaveBeenCalledOnce()
    expect(deps.client.delete).toHaveBeenCalledWith(id)
  })

  test.each([
    ["missing", undefined],
    ["claimed", { ...fresh, claimedAt: "2026-10-11T10:00:00Z" }],
    ["expired", { ...fresh, _createdAt: "2026-10-11T00:00:00Z" }],
    ["foreign type", { ...fresh, _type: "arrangement" }],
  ])("rejects a %s request without importing", async (_, document) => {
    const deps = setup(document)
    expect((await call(deps)).status).toBe(403)
    expect(deps.importUrl).not.toHaveBeenCalled()
  })

  test("rejects malformed ids before reading Sanity", async () => {
    const deps = setup(fresh)
    expect((await call(deps, { requestId: "../x" })).status).toBe(400)
    expect(deps.client.getDocument).not.toHaveBeenCalled()
  })

  test("reports private URLs to the editor", async () => {
    const deps = setup(fresh)
    deps.importUrl.mockRejectedValue(new UnsafeUrlError())
    const response = await call(deps)
    expect(response.status).toBe(400)
    expect(deps.client.delete).toHaveBeenCalledWith(id)
  })
})
