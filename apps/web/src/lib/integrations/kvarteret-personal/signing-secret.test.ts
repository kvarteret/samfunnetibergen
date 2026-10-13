import { afterEach, expect, test, vi } from "vitest"
import {
  personalSigningSecret,
  personalVerificationSecrets,
} from "./signing-secret"

const shared = "s".repeat(32)
const previous = "p".repeat(32)
const legacy = "l".repeat(32)

afterEach(() => vi.unstubAllEnvs())

test("signs only with the shared key and ignores retired volunteer secrets", () => {
  vi.stubEnv("PERSONAL_SIGNING_SECRET", shared)
  vi.stubEnv("VOLUNTEER_PROSPECT_HMAC_SECRET", legacy)
  expect(personalSigningSecret()).toBe(shared)
  vi.stubEnv("PERSONAL_SIGNING_SECRET", "too-short")
  expect(personalSigningSecret()).toBeUndefined()
})

test("verifies with only the shared key and its previous rotation key", () => {
  vi.stubEnv("PERSONAL_SIGNING_SECRET", shared)
  vi.stubEnv("PERSONAL_SIGNING_PREVIOUS_SECRET", previous)
  vi.stubEnv("VOLUNTEER_PROSPECT_HMAC_SECRET", legacy)
  vi.stubEnv("VOLUNTEER_PROSPECT_HMAC_PREVIOUS_SECRET", legacy)
  vi.stubEnv("EVENT_INTEREST_SECRET", legacy)
  expect(personalVerificationSecrets()).toEqual([shared, previous])
  vi.stubEnv("PERSONAL_SIGNING_SECRET", "")
  expect(personalSigningSecret()).toBeUndefined()
  expect(personalVerificationSecrets()).toEqual([previous])
})
