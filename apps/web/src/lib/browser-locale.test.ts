import { describe, expect, test } from "vitest"
import { localeFromAcceptLanguage } from "./browser-locale"

describe("localeFromAcceptLanguage", () => {
  test.each([
    "nb-NO,nb;q=0.9,en;q=0.8",
    "nn-NO,nb;q=0.9,en;q=0.8",
    "no,en;q=0.8",
  ])("keeps Norwegian for %s", acceptLanguage => {
    expect(localeFromAcceptLanguage(acceptLanguage)).toBe("nb")
  })

  test.each([
    "en-US,en;q=0.9,nb;q=0.8",
    "de-DE,de;q=0.9,en;q=0.8",
    "fr",
  ])("uses English for %s", acceptLanguage => {
    expect(localeFromAcceptLanguage(acceptLanguage)).toBe("en")
  })

  test("keeps the default locale when the header is absent", () => {
    expect(localeFromAcceptLanguage()).toBe("nb")
  })

  test("ignores zero-quality language ranges", () => {
    expect(localeFromAcceptLanguage("en;q=0,nb;q=0.9")).toBe("nb")
  })
})
