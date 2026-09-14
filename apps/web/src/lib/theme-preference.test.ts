import { describe, expect, test } from "vitest"
import {
  DEFAULT_THEME,
  isTheme,
  resolveTheme,
  themeOptions,
  themePreferenceScript,
} from "./theme-preference"

describe("theme preference", () => {
  test("keeps the public themes valid and defaults to HS", () => {
    expect(themeOptions.map(option => option.value)).toEqual(["hs", "skyss"])
    expect(DEFAULT_THEME).toBe("hs")
    expect(isTheme("unknown")).toBe(false)
  })

  test("prioritizes valid overrides and experiment assignments", () => {
    expect(resolveTheme({ override: "hs", experiment: "skyss" })).toBe("hs")
    expect(resolveTheme({ override: "unknown", experiment: "skyss" })).toBe(
      "skyss",
    )
    expect(resolveTheme({ experiment: "unknown" })).toBe("hs")
  })

  test("accepts the public themes from the pre-paint storage preference", () => {
    expect(themePreferenceScript).toContain('t === "hs"')
    expect(themePreferenceScript).toContain('t === "skyss"')
    expect(themePreferenceScript).toContain("dataset.theme = t")
  })
})
