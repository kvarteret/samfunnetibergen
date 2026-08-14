import { describe, expect, it } from "vitest"
import {
  buildVolunteerProspectSignature,
  createVolunteerProspectAuthHeaders,
} from "./volunteer-prospect-signing"

const HMAC_SECRET = "test-shared-secret-0123456789abcdef"
const FIXED_TIMESTAMP = "1760000000"
const FIXED_NONCE = "123e4567-e89b-42d3-a456-426614174000"
const FIXED_BODY = '{"full_name":"Kari Nordmann","email":"kari@example.com"}'
const FIXED_SIGNATURE =
  "v1=3cfde76a38294df695c172ea02132ea8902860cd6709894e1d93779ccbec6b53"

describe("volunteer prospect HMAC signing", () => {
  it("matches the shared Personal test vector", () => {
    expect(
      buildVolunteerProspectSignature(FIXED_BODY, HMAC_SECRET, {
        timestamp: FIXED_TIMESTAMP,
        nonce: FIXED_NONCE,
      }),
    ).toBe(FIXED_SIGNATURE)
  })

  it("returns all authentication headers", () => {
    expect(
      createVolunteerProspectAuthHeaders(FIXED_BODY, HMAC_SECRET, {
        timestamp: FIXED_TIMESTAMP,
        nonce: FIXED_NONCE,
      }),
    ).toEqual({
      "X-Kvarteret-Timestamp": FIXED_TIMESTAMP,
      "X-Kvarteret-Nonce": FIXED_NONCE,
      "X-Kvarteret-Signature": FIXED_SIGNATURE,
    })
  })

  it("rejects missing and short secrets", () => {
    expect(() =>
      createVolunteerProspectAuthHeaders(FIXED_BODY, undefined),
    ).toThrow("at least 32 characters")
    expect(() =>
      createVolunteerProspectAuthHeaders(FIXED_BODY, "too-short"),
    ).toThrow("at least 32 characters")
  })
})
