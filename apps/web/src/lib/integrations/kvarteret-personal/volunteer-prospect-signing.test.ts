import { describe, expect, it } from "vitest"
import {
  buildVolunteerProspectSignature,
  createVolunteerProspectAuthHeaders,
  createVolunteerProspectClientKey,
  resolveVolunteerProspectIdempotencyKey,
} from "./volunteer-prospect-signing"

const HMAC_SECRET = "test-shared-secret-0123456789abcdef"
const CLIENT_KEY_SECRET = "test-client-key-secret-0123456789abcdef"
const FIXED_TIMESTAMP = "1760000000"
const FIXED_NONCE = "123e4567-e89b-42d3-a456-426614174000"
const FIXED_IDEMPOTENCY_KEY = "123e4567-e89b-42d3-a456-426614174001"
const FIXED_CLIENT_KEY =
  "v1=9a0dcfcc46f5fc85d1151d64c99635e5d32febbe873c1d9467cf618652eb84e5"
const FIXED_BODY = '{"full_name":"Kari Nordmann","email":"kari@example.com"}'
const FIXED_SIGNATURE =
  "v2=4494eaa27eeaa0095320f8293384f7dbd3c814d81b17c9e6c83cd0539615837a"

describe("volunteer prospect HMAC signing", () => {
  it("matches the shared Personal v2 test vector", () => {
    expect(
      buildVolunteerProspectSignature(FIXED_BODY, HMAC_SECRET, {
        timestamp: FIXED_TIMESTAMP,
        nonce: FIXED_NONCE,
        idempotencyKey: FIXED_IDEMPOTENCY_KEY,
        clientKey: FIXED_CLIENT_KEY,
      }),
    ).toBe(FIXED_SIGNATURE)
  })

  it("returns all authentication headers", () => {
    expect(
      createVolunteerProspectAuthHeaders(FIXED_BODY, HMAC_SECRET, {
        timestamp: FIXED_TIMESTAMP,
        nonce: FIXED_NONCE,
        idempotencyKey: FIXED_IDEMPOTENCY_KEY,
        clientKey: FIXED_CLIENT_KEY,
      }),
    ).toEqual({
      "X-Kvarteret-Timestamp": FIXED_TIMESTAMP,
      "X-Kvarteret-Nonce": FIXED_NONCE,
      "X-Kvarteret-Idempotency-Key": FIXED_IDEMPOTENCY_KEY,
      "X-Kvarteret-Client-Key": FIXED_CLIENT_KEY,
      "X-Kvarteret-Signature": FIXED_SIGNATURE,
    })
  })

  it("binds both the idempotency key and client key into v2", () => {
    const baseline = buildVolunteerProspectSignature(FIXED_BODY, HMAC_SECRET, {
      timestamp: FIXED_TIMESTAMP,
      nonce: FIXED_NONCE,
      idempotencyKey: FIXED_IDEMPOTENCY_KEY,
      clientKey: FIXED_CLIENT_KEY,
    })

    expect(
      buildVolunteerProspectSignature(FIXED_BODY, HMAC_SECRET, {
        timestamp: FIXED_TIMESTAMP,
        nonce: FIXED_NONCE,
        idempotencyKey: "123e4567-e89b-42d3-a456-426614174002",
        clientKey: FIXED_CLIENT_KEY,
      }),
    ).not.toBe(baseline)
    expect(
      buildVolunteerProspectSignature(FIXED_BODY, HMAC_SECRET, {
        timestamp: FIXED_TIMESTAMP,
        nonce: FIXED_NONCE,
        idempotencyKey: FIXED_IDEMPOTENCY_KEY,
        clientKey: `v1=${"b".repeat(64)}`,
      }),
    ).not.toBe(baseline)
  })

  it("rejects missing and short secrets", () => {
    expect(() =>
      createVolunteerProspectAuthHeaders(FIXED_BODY, undefined, {
        idempotencyKey: FIXED_IDEMPOTENCY_KEY,
        clientKey: FIXED_CLIENT_KEY,
      }),
    ).toThrow("at least 32 characters")
    expect(() =>
      createVolunteerProspectAuthHeaders(FIXED_BODY, "too-short", {
        idempotencyKey: FIXED_IDEMPOTENCY_KEY,
        clientKey: FIXED_CLIENT_KEY,
      }),
    ).toThrow("at least 32 characters")
  })

  it("derives a pseudonymous key from the Vercel client IP", () => {
    const headers = new Headers({
      "x-vercel-forwarded-for": "203.0.113.42",
      "x-forwarded-for": "198.51.100.7",
    })

    const clientKey = createVolunteerProspectClientKey(
      headers,
      CLIENT_KEY_SECRET,
    )

    expect(clientKey).toBe(FIXED_CLIENT_KEY)
    expect(clientKey).not.toContain("203.0.113.42")
    expect(clientKey).not.toContain("198.51.100.7")
  })

  it("uses the first validated forwarded IP and rejects unusable identity data", () => {
    expect(
      createVolunteerProspectClientKey(
        new Headers({ "x-forwarded-for": "203.0.113.42, 198.51.100.7" }),
        CLIENT_KEY_SECRET,
      ),
    ).toBe(FIXED_CLIENT_KEY)
    expect(() =>
      createVolunteerProspectClientKey(new Headers(), CLIENT_KEY_SECRET),
    ).toThrow("trusted client IP")
    expect(() =>
      createVolunteerProspectClientKey(
        new Headers({ "x-forwarded-for": "not-an-ip" }),
        CLIENT_KEY_SECRET,
      ),
    ).toThrow("trusted client IP")
    expect(() =>
      createVolunteerProspectClientKey(
        new Headers({ "x-forwarded-for": "203.0.113.42" }),
        "too-short",
      ),
    ).toThrow("at least 32 characters")
  })

  it("accepts canonical idempotency UUIDs and generates a UUID when absent", () => {
    expect(resolveVolunteerProspectIdempotencyKey(FIXED_IDEMPOTENCY_KEY)).toBe(
      FIXED_IDEMPOTENCY_KEY,
    )
    expect(resolveVolunteerProspectIdempotencyKey(null)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    )
    expect(() =>
      resolveVolunteerProspectIdempotencyKey(
        FIXED_IDEMPOTENCY_KEY.toUpperCase(),
      ),
    ).toThrow("canonical UUID")
  })
})
