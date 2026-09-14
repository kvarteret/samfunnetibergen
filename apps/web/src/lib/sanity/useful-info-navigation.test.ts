import { describe, expect, it } from "vitest"
import { getVergeordningHref } from "./useful-info-navigation"

describe("getVergeordningHref", () => {
  it("uses the published section key as the anchor", () => {
    expect(getVergeordningHref({ _key: "7d0eec2032cc" })).toBe(
      "/nyttig#7d0eec2032cc",
    )
  })

  it("omits the shortcut when the source section is unavailable", () => {
    expect(getVergeordningHref(null)).toBeNull()
    expect(getVergeordningHref({ _key: "other" })).toBeNull()
  })
})
