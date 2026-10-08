import { beforeEach, describe, expect, it, vi } from "vitest"

const { evaluateFlagsMock } = vi.hoisted(() => ({
  evaluateFlagsMock: vi.fn(),
}))

vi.mock("@/lib/posthog-server", () => ({
  getPostHogClient: () => ({ evaluateFlags: evaluateFlagsMock }),
}))

import { GET, resetInfoscreenPartyFlagCache } from "./route"

async function readEnabled() {
  const response = await GET()
  return ((await response.json()) as { enabled: boolean }).enabled
}

describe("GET /api/infoskjerm/party", () => {
  beforeEach(() => {
    resetInfoscreenPartyFlagCache()
    evaluateFlagsMock.mockReset()
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "phc_test")
  })

  it("is on when the flag is on", async () => {
    evaluateFlagsMock.mockResolvedValue({ isEnabled: () => true })
    expect(await readEnabled()).toBe(true)
  })

  it("is off when the flag is off or missing", async () => {
    evaluateFlagsMock.mockResolvedValue({ isEnabled: () => false })
    expect(await readEnabled()).toBe(false)

    resetInfoscreenPartyFlagCache()
    evaluateFlagsMock.mockResolvedValue({ isEnabled: () => undefined })
    expect(await readEnabled()).toBe(false)
  })

  it("is off when PostHog cannot be reached", async () => {
    evaluateFlagsMock.mockRejectedValue(new Error("network"))
    expect(await readEnabled()).toBe(false)
  })

  it("is off without a PostHog token", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "")
    evaluateFlagsMock.mockResolvedValue({ isEnabled: () => true })
    expect(await readEnabled()).toBe(false)
    expect(evaluateFlagsMock).not.toHaveBeenCalled()
  })

  it("does not ask PostHog again within the cache window", async () => {
    evaluateFlagsMock.mockResolvedValue({ isEnabled: () => true })
    await readEnabled()
    await readEnabled()
    expect(evaluateFlagsMock).toHaveBeenCalledTimes(1)
  })
})
