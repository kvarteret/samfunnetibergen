import { afterEach, describe, expect, it, vi } from "vitest"

import { resolveSiteUrl } from "./site-url"

const SITE_URL_ENVIRONMENT_KEYS = [
  "SITE_URL",
  "NEXT_PUBLIC_SITE_URL",
  "VERCEL_PROJECT_PRODUCTION_URL",
  "VERCEL_URL",
] as const

const originalEnvironment = Object.fromEntries(
  SITE_URL_ENVIRONMENT_KEYS.map(key => [key, process.env[key]]),
)

afterEach(() => {
  vi.unstubAllEnvs()

  for (const key of SITE_URL_ENVIRONMENT_KEYS) {
    const value = originalEnvironment[key]
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
})

describe("resolveSiteUrl", () => {
  it("uses the local origin when no site URL is configured", () => {
    for (const key of SITE_URL_ENVIRONMENT_KEYS) vi.stubEnv(key, "")

    expect(resolveSiteUrl()).toBe("http://localhost:3187")
  })

  it("normalizes a configured hostname and trailing slash", () => {
    vi.stubEnv("SITE_URL", " preview.example.com/ ")

    expect(resolveSiteUrl()).toBe("https://preview.example.com")
  })

  it("skips an invalid higher-priority value", () => {
    vi.stubEnv("SITE_URL", "https://[invalid")
    vi.stubEnv("VERCEL_URL", "preview.example.com")

    expect(resolveSiteUrl()).toBe("https://preview.example.com")
  })

  it("uses the canonical production origin for either production hostname", () => {
    vi.stubEnv("SITE_URL", "https://samfunnetibergen.no")

    expect(resolveSiteUrl()).toBe("https://www.samfunnetibergen.no")
  })

  it("rejects non-HTTP URL schemes", () => {
    vi.stubEnv("SITE_URL", "ftp://preview.example.com")

    expect(resolveSiteUrl()).toBe("http://localhost:3187")
  })
})
