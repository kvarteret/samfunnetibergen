import { describe, expect, it, vi } from "vitest"

import { createCoalescedAsyncRunner } from "./coalescedAsyncRunner"

describe("coalesced async runner", () => {
  it("serializes overlapping calls and coalesces them into one follow-up", async () => {
    let releaseFirstRun: (() => void) | undefined
    const firstRunBlocked = new Promise<void>(resolve => {
      releaseFirstRun = resolve
    })
    const task = vi
      .fn<() => Promise<void>>()
      .mockImplementationOnce(() => firstRunBlocked)
      .mockResolvedValue(undefined)
    const run = createCoalescedAsyncRunner()

    const first = run(task)
    const second = run(task)
    const third = run(task)

    expect(second).toBe(first)
    expect(third).toBe(first)
    expect(task).toHaveBeenCalledTimes(1)

    releaseFirstRun?.()
    await first

    expect(task).toHaveBeenCalledTimes(2)
  })

  it("accepts a new operation after a failed task", async () => {
    const task = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValue(undefined)
    const run = createCoalescedAsyncRunner()

    await expect(run(task)).rejects.toThrow("network")
    await expect(run(task)).resolves.toBeUndefined()
    expect(task).toHaveBeenCalledTimes(2)
  })
})
