import { afterEach, expect, test, vi } from "vitest"
import {
  personalSigningSecret,
  personalVerificationSecrets,
} from "./signing-secret"

const shared = "s".repeat(32)
const previous = "p".repeat(32)
const legacy = "l".repeat(32)

afterEach(() => vi.unstubAllEnvs())

test("signs with the shared key and falls back to the route's legacy name", () => {
  vi.stubEnv("PERSONAL_SIGNING_SECRET", shared)
  vi.stubEnv("VOLUNTEER_PROSPECT_HMAC_SECRET", legacy)
  expect(personalSigningSecret("VOLUNTEER_PROSPECT_HMAC_SECRET")).toBe(shared)
  vi.stubEnv("PERSONAL_SIGNING_SECRET", "too-short")
  expect(personalSigningSecret("VOLUNTEER_PROSPECT_HMAC_SECRET")).toBe(legacy)
  expect(personalSigningSecret()).toBeUndefined()
})

test("verifies with shared, previous and only the route's legacy key", () => {
  vi.stubEnv("PERSONAL_SIGNING_SECRET", shared)
  vi.stubEnv("PERSONAL_SIGNING_PREVIOUS_SECRET", previous)
  vi.stubEnv("VOLUNTEER_PROSPECT_HMAC_SECRET", shared)
  vi.stubEnv("EVENT_INTEREST_SECRET", legacy)
  expect(personalVerificationSecrets("VOLUNTEER_PROSPECT_HMAC_SECRET")).toEqual(
    [shared, previous],
  )
  expect(personalVerificationSecrets()).toEqual([shared, previous])
})
