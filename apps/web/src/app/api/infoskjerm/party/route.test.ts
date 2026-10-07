import { beforeEach, describe, expect, it, vi } from "vitest"

const { isFeatureEnabledMock } = vi.hoisted(() => ({
  isFeatureEnabledMock: vi.fn(),
}))

vi.mock("@/lib/posthog-server", () => ({
  getPostHogClient: () => ({ isFeatureEnabled: isFeatureEnabledMock }),
}))

import { GET, resetInfoscreenPartyFlagCache } from "./route"

async function readEnabled() {
  const response = await GET()
  return ((await response.json()) as { enabled: boolean }).enabled
}

describe("GET /api/infoskjerm/party", () => {
  beforeEach(() => {
    resetInfoscreenPartyFlagCache()
    isFeatureEnabledMock.mockReset()
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "phc_test")
  })

  it("is on when the flag is on", async () => {
    isFeatureEnabledMock.mockResolvedValue(true)
    expect(await readEnabled()).toBe(true)
  })

  it("is off when the flag is off or missing", async () => {
    isFeatureEnabledMock.mockResolvedValue(false)
    expect(await readEnabled()).toBe(false)

    resetInfoscreenPartyFlagCache()
    isFeatureEnabledMock.mockResolvedValue(undefined)
    expect(await readEnabled()).toBe(false)
  })

  it("is off when PostHog cannot be reached", async () => {
    isFeatureEnabledMock.mockRejectedValue(new Error("network"))
    expect(await readEnabled()).toBe(false)
  })

  it("is off without a PostHog token", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "")
    isFeatureEnabledMock.mockResolvedValue(true)
    expect(await readEnabled()).toBe(false)
    expect(isFeatureEnabledMock).not.toHaveBeenCalled()
  })

  it("does not ask PostHog again within the cache window", async () => {
    isFeatureEnabledMock.mockResolvedValue(true)
    await readEnabled()
    await readEnabled()
    expect(isFeatureEnabledMock).toHaveBeenCalledTimes(1)
  })
})
