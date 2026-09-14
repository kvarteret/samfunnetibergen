import { describe, expect, it } from "vitest"
import {
  resetMobileMenuState,
  toggleMobileMenuGroup,
} from "./mobile-menu-state"

describe("mobile menu primary group state", () => {
  it("starts with no expanded group", () => {
    expect(resetMobileMenuState()).toBeNull()
  })

  it("keeps only one primary group expanded", () => {
    expect(toggleMobileMenuGroup(null, "booking")).toBe("booking")
    expect(toggleMobileMenuGroup("booking", "useful-info")).toBe("useful-info")
  })

  it("collapses the active group when toggled again", () => {
    expect(toggleMobileMenuGroup("more", "more")).toBeNull()
  })
})
