import { afterEach, expect, it, vi } from "vitest"
import { GET, HEAD, OPTIONS } from "./route"

afterEach(() => vi.unstubAllEnvs())

it("returns the current deployment without caching", async () => {
  vi.stubEnv("VERCEL_DEPLOYMENT_ID", "dpl_current")
  const response = await GET()
  expect(response.status).toBe(200)
  expect(response.headers.get("cache-control")).toBe("no-store")
  expect(await response.json()).toEqual({ deploymentId: "dpl_current" })
})

it("does not invent a deployment ID outside Vercel", async () => {
  vi.stubEnv("VERCEL_DEPLOYMENT_ID", undefined)
  expect(await (await GET()).json()).toEqual({ deploymentId: null })
})

it("supports the public API HEAD and CORS conventions without caching versions", async () => {
  const response = await HEAD()
  expect(response.headers.get("cache-control")).toBe("no-store")
  expect(response.headers.get("access-control-allow-origin")).toBe("*")
  expect(await response.text()).toBe("")
  const options = OPTIONS()
  expect(options.status).toBe(204)
  expect(options.headers.get("allow")).toBe("GET, HEAD, OPTIONS")
})
