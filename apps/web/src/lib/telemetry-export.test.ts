import { describe, expect, it, vi } from "vitest"
import { withExportLifetime } from "./telemetry-export"
const { retained } = vi.hoisted(() => ({ retained: [] as Promise<void>[] }))
vi.mock("@vercel/functions", () => ({
  waitUntil: (promise: Promise<void>) => retained.push(promise),
}))

describe("telemetry export lifetime", () => {
  it("keeps the invocation alive until HTTP completion, including failures", async () => {
    for (const code of [0, 1]) {
      let done: ((result: { code: number }) => void) | undefined
      const callback = vi.fn()
      const exporter = withExportLifetime({
        export(_items: string[], next: (result: { code: number }) => void) {
          done = next
        },
        shutdown: async () => {},
      })
      exporter.export(["record"], callback)
      let resolved = false
      const pending = retained.at(-1)!.then(() => {
        resolved = true
      })
      await Promise.resolve()
      expect(resolved).toBe(false)
      expect(callback).not.toHaveBeenCalled()
      done!({ code })
      await pending
      expect(callback).toHaveBeenCalledWith({ code })
      expect(resolved).toBe(true)
    }
  })
})
