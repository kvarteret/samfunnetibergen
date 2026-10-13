import { createHmac } from "node:crypto"
import { afterEach, describe, expect, it, vi } from "vitest"
import { RETENTION_SECONDS } from "../domain/interest"
import { createSourceCookie, sourceCookieName, sourceHash } from "./source"

afterEach(() => vi.unstubAllEnvs())
describe("event-specific sources", () => {
  it("verifies signed cookies only for the originating event and lifetime", () => {
    vi.stubEnv("PERSONAL_SIGNING_SECRET", "a".repeat(32))
    const now = 1800000000000
    const cookie = createSourceCookie("event-a", now)
    expect(sourceHash("event-a", cookie, now)).toMatch(/^[a-f0-9]{64}$/)
    expect(sourceHash("event-b", cookie, now)).toBeNull()
    expect(sourceHash("event-a", `${cookie.slice(0, -1)}z`, now)).toBeNull()
    expect(
      sourceHash("event-a", cookie, now + RETENTION_SECONDS * 1000),
    ).toBeNull()
    expect(sourceHash("event-a", cookie, now - 1000)).toBeNull()
    expect(sourceCookieName("event-a")).not.toEqual(sourceCookieName("event-b"))
  })
  it("creates independent sources and refuses missing signing configuration", () => {
    vi.stubEnv("PERSONAL_SIGNING_SECRET", "a".repeat(32))
    expect(createSourceCookie("event")).not.toEqual(createSourceCookie("event"))
    vi.stubEnv("PERSONAL_SIGNING_SECRET", "")
    expect(() => createSourceCookie("event")).toThrow()
  })
  it("rejects retired event-interest keys and unprefixed legacy cookies", () => {
    const legacy = "l".repeat(32)
    vi.stubEnv("PERSONAL_SIGNING_SECRET", "s".repeat(32))
    vi.stubEnv("EVENT_INTEREST_SECRET", legacy)
    const now = 1800000000000
    const token = `${"0".repeat(32)}.${now / 1000}`
    for (const message of [
      `event-a:${token}`,
      `event-interest-source-v1:event-a:${token}`,
    ]) {
      const signed = createHmac("sha256", legacy).update(message).digest("hex")
      expect(sourceHash("event-a", `${token}.${signed}`, now)).toBeNull()
    }
    vi.stubEnv("PERSONAL_SIGNING_SECRET", "")
    expect(() => createSourceCookie("event-a", now)).toThrow()
  })
  it("accepts the previous shared key only with the event-interest purpose prefix", () => {
    const previous = "p".repeat(32)
    vi.stubEnv("PERSONAL_SIGNING_SECRET", "s".repeat(32))
    vi.stubEnv("PERSONAL_SIGNING_PREVIOUS_SECRET", previous)
    const now = 1800000000000
    const token = `${"0".repeat(32)}.${now / 1000}`
    const signed = createHmac("sha256", previous)
      .update(`event-interest-source-v1:event-a:${token}`)
      .digest("hex")
    expect(sourceHash("event-a", `${token}.${signed}`, now)).toBe(signed)
    expect(sourceHash("event-b", `${token}.${signed}`, now)).toBeNull()
  })
  it("signs new sources under their own purpose prefix", () => {
    const secret = "s".repeat(32)
    vi.stubEnv("PERSONAL_SIGNING_SECRET", secret)
    const cookie = createSourceCookie("event-a", 1800000000000)
    const [random, issued, signed] = cookie.split(".")
    expect(signed).not.toBe(
      createHmac("sha256", secret)
        .update(`event-a:${random}.${issued}`)
        .digest("hex"),
    )
  })
})
