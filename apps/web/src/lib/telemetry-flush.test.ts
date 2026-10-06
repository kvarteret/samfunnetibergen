import { beforeEach, describe, expect, it, vi } from "vitest"

const { after } = vi.hoisted(() => ({ after: vi.fn() }))
vi.mock("next/server", () => ({ after }))

beforeEach(() => {
  vi.resetModules()
  after.mockReset()
})

describe("server telemetry delivery", () => {
  it("does nothing before telemetry is configured", async () => {
    const { scheduleTelemetryFlush } = await import("./telemetry-flush")
    scheduleTelemetryFlush()
    expect(after).not.toHaveBeenCalled()
  })

  it("keeps log and trace export completion in the response lifecycle", async () => {
    const { registerTelemetryFlush, scheduleTelemetryFlush } = await import(
      "./telemetry-flush"
    )
    const flush = vi.fn().mockResolvedValue(undefined)
    registerTelemetryFlush(flush)
    scheduleTelemetryFlush()
    expect(flush).not.toHaveBeenCalled()
    await after.mock.calls[0][0]()
    expect(flush).toHaveBeenCalledOnce()
  })
})
