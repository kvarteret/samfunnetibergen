import { describe, expect, it, vi } from "vitest"
import {
  getHandledExceptionProperties,
  getPostHogDistinctIdFromCookie,
  getPostHogEnvironment,
  toPostHogException,
} from "./error-context"

describe("PostHog error context", () => {
  it("extracts distinct_id from the PostHog project cookie", () => {
    const value = encodeURIComponent(JSON.stringify({ distinct_id: "abc-123" }))
    const cookie = `other=value; ph_phc_project_posthog=${value}; theme=dark`

    expect(getPostHogDistinctIdFromCookie(cookie)).toBe("abc-123")
  })

  it("extracts distinct_id from array cookie headers", () => {
    const value = encodeURIComponent(JSON.stringify({ distinct_id: "user-42" }))

    expect(
      getPostHogDistinctIdFromCookie([
        "first=value",
        `ph_phc_project_posthog=${value}`,
      ]),
    ).toBe("user-42")
  })

  it("ignores malformed PostHog cookies", () => {
    expect(
      getPostHogDistinctIdFromCookie("ph_phc_project_posthog=not-json"),
    ).toBeUndefined()
  })

  it("normalizes unknown thrown values to Error instances", () => {
    expect(toPostHogException("failed").message).toBe("failed")
    expect(toPostHogException({}).message).toBe("Unknown error")
  })

  it("uses Vercel preview environment when available", () => {
    vi.stubEnv("VERCEL_ENV", "preview")

    expect(getPostHogEnvironment()).toBe("preview")
    expect(getHandledExceptionProperties("feedback")).toMatchObject({
      environment: "preview",
      workflow: "feedback",
      handled: true,
    })

    vi.unstubAllEnvs()
  })
})
