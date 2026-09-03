import { describe, expect, it } from "vitest"

import { buildPublicEventsOpenApi, GET } from "./route"

describe("public events OpenAPI document", () => {
  it("documents both v1 resources without the internal compatibility switch", () => {
    const document = buildPublicEventsOpenApi("https://api.example.test")

    expect(document.openapi).toBe("3.1.0")
    expect(document.servers).toEqual([{ url: "https://api.example.test" }])
    expect(document.paths).toHaveProperty("/api/v1/events")
    expect(document.paths).toHaveProperty("/api/v1/events/{slug}")
    expect(document.security).toEqual([])
    expect(document.paths["/api/v1/events"]).toHaveProperty("get")
    expect(document.paths["/api/v1/events"]).toHaveProperty("head")
    expect(document.paths["/api/v1/events"]).toHaveProperty("options")
    expect(document.paths["/api/v1/events/{slug}"]).toHaveProperty("head")
    expect(document.paths["/api/v1/events/{slug}"]).toHaveProperty("options")
    expect(JSON.stringify(document)).not.toContain("includeInternal")
    expect(JSON.stringify(document)).not.toContain("cursor")
    expect(JSON.stringify(document)).not.toContain("paginated")
    expect(document.components.schemas).toHaveProperty("PublicEventsResponse")
    expect(document.components.schemas).toHaveProperty("PublicEventResponse")
    expect(document.components.schemas).toHaveProperty("PublicErrorResponse")
    const serialized = JSON.stringify(
      document.components.schemas.PublicEventsResponse,
    )
    expect(serialized).toContain("updatedAt")
    expect(serialized).toContain("pricing")
    expect(serialized).toContain("ticket")
    expect(serialized).toContain("Det Akademiske Kvarter")
    expect(serialized).toContain("description")
    expect(serialized).toContain("timed")
    expect(serialized).toContain("date")
  })

  it("serves JSON with the public API protocol headers", async () => {
    process.env.SITE_URL = "https://api.example.test"
    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(response.headers.get("Content-Type")).toBe(
      "application/json; charset=utf-8",
    )
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*")
    expect(body.openapi).toBe("3.1.0")
  })
})
