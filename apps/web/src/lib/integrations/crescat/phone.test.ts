import { describe, expect, test } from "vitest"
import { splitE164ForCrescat } from "./phone"

describe("splitE164ForCrescat", () => {
  test("splits Norwegian and British E.164 numbers at the Crescat boundary", () => {
    expect(splitE164ForCrescat("+4740612345")).toEqual({
      phone: "40612345",
      countryCode: "+47",
    })
    expect(splitE164ForCrescat("+447400123456")).toEqual({
      phone: "7400123456",
      countryCode: "+44",
    })
  })

  test("keeps the optional empty value compatible with Crescat", () => {
    expect(splitE164ForCrescat("")).toEqual({
      phone: "",
      countryCode: "+47",
    })
  })

  test("passes the explicit Norwegian fallback to Crescat", () => {
    expect(splitE164ForCrescat("+4700000000")).toEqual({
      phone: "00000000",
      countryCode: "+47",
    })
  })

  test("rejects values outside the canonical boundary", () => {
    expect(() => splitE164ForCrescat("40612345")).toThrow()
  })
})
