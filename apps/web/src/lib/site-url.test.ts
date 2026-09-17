import { afterEach, beforeEach, describe, expect, test } from "vitest"
import { resolveSiteUrl } from "./site-url"

const SITE_URL_VARIABLES = [
  "SITE_URL",
  "NEXT_PUBLIC_SITE_URL",
  "VERCEL_PROJECT_PRODUCTION_URL",
  "VERCEL_URL",
] as const

const originalSiteUrlVariables = Object.fromEntries(
  SITE_URL_VARIABLES.map(name => [name, process.env[name]]),
)

function clearSiteUrlVariables() {
  for (const name of SITE_URL_VARIABLES) {
    delete process.env[name]
  }
}

beforeEach(clearSiteUrlVariables)

afterEach(() => {
  for (const name of SITE_URL_VARIABLES) {
    const original = originalSiteUrlVariables[name]
    if (original === undefined) {
      delete process.env[name]
    } else {
      process.env[name] = original
    }
  }
})

describe("resolveSiteUrl", () => {
  test("returns the canonical origin for the production apex host", () => {
    process.env.SITE_URL = "https://samfunnetibergen.no"
    expect(resolveSiteUrl()).toBe("https://www.samfunnetibergen.no")
  })

  test("adds a scheme to a bare host and strips trailing slashes", () => {
    process.env.SITE_URL = "example.com/"
    expect(resolveSiteUrl()).toBe("https://example.com")
  })

  test("falls back to the next variable when a value is a pulled placeholder", () => {
    process.env.SITE_URL = "[SENSITIVE]"
    process.env.NEXT_PUBLIC_SITE_URL = "https://preview.example.com"
    expect(resolveSiteUrl()).toBe("https://preview.example.com")
  })

  test("skips values that are not valid URLs", () => {
    process.env.SITE_URL = "https://[SENSITIVE]"
    process.env.VERCEL_URL = "preview.vercel.app"
    expect(resolveSiteUrl()).toBe("https://preview.vercel.app")
  })

  test("falls back to local development when nothing is configured", () => {
    expect(resolveSiteUrl()).toBe("http://localhost:3187")
  })
})
