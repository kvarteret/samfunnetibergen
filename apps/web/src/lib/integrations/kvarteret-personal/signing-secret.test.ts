import { afterEach, expect, test, vi } from "vitest"
import {
  personalSigningSecret,
  personalVerificationSecrets,
} from "./signing-secret"

const shared = "s".repeat(32)
const previous = "p".repeat(32)

afterEach(() => vi.unstubAllEnvs())

test("signs only with a configured shared key", () => {
  vi.stubEnv("PERSONAL_SIGNING_SECRET", shared)
  expect(personalSigningSecret()).toBe(shared)
  vi.stubEnv("PERSONAL_SIGNING_SECRET", "too-short")
  expect(personalSigningSecret()).toBeUndefined()
})

test("verifies with the shared and previous keys", () => {
  vi.stubEnv("PERSONAL_SIGNING_SECRET", shared)
  vi.stubEnv("PERSONAL_SIGNING_PREVIOUS_SECRET", previous)
  expect(personalVerificationSecrets()).toEqual([shared, previous])
})
