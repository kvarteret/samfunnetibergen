import posthog from "posthog-js"
import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("posthog-js", () => ({
  default: { init: vi.fn(), register: vi.fn() },
}))

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.clearAllMocks()
  vi.resetModules()
})

describe("PostHog initialization", () => {
  it.each([
    "https://www.samfunnetibergen.no/infoskjerm?message=Sp%C3%B8rsmål",
    "https://www.samfunnetibergen.no/infoskjerm/",
    "http://localhost:3187/infoskjerm",
  ])("does not initialize tracking for %s", async url => {
    vi.stubGlobal("window", { location: new URL(url) })
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_ENABLE_LOCALHOST", "true")
    await import("./instrumentation-client")
    expect(posthog.init).not.toHaveBeenCalled()
    expect(posthog.register).not.toHaveBeenCalled()
  })

  it("keeps tracking enabled on public pages", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "test-token")
    vi.stubGlobal("window", {
      location: new URL("https://www.samfunnetibergen.no/nb"),
    })
    await import("./instrumentation-client")
    expect(posthog.init).toHaveBeenCalledWith(
      "test-token",
      expect.objectContaining({
        capture_pageview: true,
        capture_exceptions: true,
        logs: expect.objectContaining({
          serviceName: "samfunnetibergen-browser",
          beforeSend: expect.any(Function),
        }),
        before_send: expect.any(Function),
      }),
    )
    expect(posthog.register).toHaveBeenCalled()
  })
})
