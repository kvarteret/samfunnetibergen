import { afterEach, describe, expect, it, vi } from "vitest"
import { RETENTION_SECONDS } from "../domain/interest"
import { createSourceCookie, sourceCookieName, sourceHash } from "./source"

afterEach(() => vi.unstubAllEnvs())
describe("event-specific sources", () => {
  it("verifies signed cookies only for the originating event and lifetime", () => {
    vi.stubEnv("EVENT_INTEREST_SECRET", "a".repeat(32))
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
    vi.stubEnv("EVENT_INTEREST_SECRET", "a".repeat(32))
    expect(createSourceCookie("event")).not.toEqual(createSourceCookie("event"))
    vi.stubEnv("EVENT_INTEREST_SECRET", "")
    expect(() => createSourceCookie("event")).toThrow()
  })
})
