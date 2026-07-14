import { describe, expect, it } from "vitest"

import robots from "./robots"

describe("robots.txt", () => {
  it("allows all crawlers and publishes the canonical sitemap", () => {
    const result = robots()

    expect(result.rules).toEqual({ userAgent: "*", allow: "/" })
    expect(result.sitemap).toMatch(/\/sitemap\.xml$/)
    expect(result.rules).not.toHaveProperty("disallow")
  })
})
