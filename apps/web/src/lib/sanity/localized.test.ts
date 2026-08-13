import { describe, expect, it } from "vitest"
import { resolveLocalizedValue } from "./localized"

describe("resolveLocalizedValue", () => {
  const values = [
    { _key: "one", language: "nb", value: "Norsk" },
    { _key: "two", language: "en", value: "English" },
  ]

  it("selects the requested locale", () => {
    expect(resolveLocalizedValue(values, "en", "nb", "legacy")).toBe("English")
  })

  it("falls back to the base locale and then legacy content", () => {
    expect(resolveLocalizedValue(values, "de", "nb", "legacy")).toBe("Norsk")
    expect(resolveLocalizedValue([], "de", "nb", "legacy")).toBe("legacy")
    expect(resolveLocalizedValue([], "de", "nb")).toBeNull()
  })
})
