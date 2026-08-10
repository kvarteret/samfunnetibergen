import { describe, expect, test } from "vitest"
import { formatPhoneNumber } from "react-phone-number-input/max"
import {
  isE164PhoneNumber,
  isOptionalE164PhoneNumber,
  NORWEGIAN_PHONE_FALLBACK,
} from "./phone-number"

describe("E.164 phone validation", () => {
  test.each([
    "+4740612345",
    "+447400123456",
  ])("accepts an international value: %s", value => {
    expect(isE164PhoneNumber(value)).toBe(true)
  })

  test.each([
    "40612345",
    "4740612345",
    "+47123",
    "+04740612345",
  ])("rejects a non-E.164 or invalid value: %s", value => {
    expect(isE164PhoneNumber(value)).toBe(false)
  })

  test("allows an empty optional phone number", () => {
    expect(isOptionalE164PhoneNumber("")).toBe(true)
  })

  test("accepts the explicit Norwegian no-number fallback", () => {
    expect(isE164PhoneNumber(NORWEGIAN_PHONE_FALLBACK)).toBe(true)
    expect(isE164PhoneNumber("+4600000000")).toBe(false)
  })

  test("uses the library's national formatting", () => {
    expect(formatPhoneNumber("+4795230903")).toBe("95 23 09 03")
  })
})
