import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const flags = vi.hoisted(() => ({
  enabled: true as boolean | undefined,
  loads: true,
  listeners: [] as (() => void)[],
}))

vi.mock("posthog-js", () => ({
  default: {
    onFeatureFlags: (callback: () => void) => {
      flags.listeners.push(callback)
      if (flags.loads) callback()
      return () => {}
    },
    isFeatureEnabled: () => flags.enabled,
  },
}))

// Status is module state, so every case loads a fresh copy.
async function load({ host = "lekeplass.example" } = {}) {
  vi.resetModules()
  vi.stubEnv("NEXT_PUBLIC_PARTY_HOST", host)
  vi.stubEnv("NODE_ENV", "production")
  return import("./playground")
}

async function settle(playground: Awaited<ReturnType<typeof load>>, ms = 6000) {
  playground.checkPlayground()
  await vi.advanceTimersByTimeAsync(ms)
  return playground.getPlaygroundStatus()
}

describe("playground status", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    flags.enabled = true
    flags.loads = true
    flags.listeners = []
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("ok", { status: 200 })),
    )
    vi.stubGlobal("window", globalThis)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it("is offered when the server answers and the flag is on", async () => {
    expect(await settle(await load())).toBe("ok")
  })

  it("is never offered without a host", async () => {
    const playground = await load({ host: "" })
    expect(await settle(playground)).toBe("failed")
    expect(fetch).not.toHaveBeenCalled()
  })

  it("is not offered when the health check fails", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("", { status: 503 }))
    expect(await settle(await load())).toBe("failed")
  })

  it("is not offered when the server is unreachable", async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError("Failed to fetch"))
    expect(await settle(await load())).toBe("failed")
  })

  it("is not offered when the flag is off", async () => {
    flags.enabled = false
    expect(await settle(await load())).toBe("failed")
  })

  it("is not offered when PostHog never loads flags", async () => {
    flags.loads = false
    expect(await settle(await load())).toBe("failed")
  })

  it("is withdrawn when the flag is turned off later", async () => {
    const playground = await load()
    expect(await settle(playground)).toBe("ok")
    flags.enabled = false
    for (const listener of flags.listeners) listener()
    expect(playground.getPlaygroundStatus()).toBe("failed")
  })

  it("stays withdrawn after a failure", async () => {
    const playground = await load()
    expect(await settle(playground)).toBe("ok")
    playground.markPlaygroundFailed()
    playground.checkPlayground()
    expect(playground.getPlaygroundStatus()).toBe("failed")
  })
})
