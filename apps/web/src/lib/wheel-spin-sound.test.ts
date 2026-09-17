import { describe, expect, it } from "vitest"

import {
  createWheelSpinSound,
  isWheelSpinSoundSupported,
  spinTicks,
} from "./wheel-spin-sound"

const SPIN_MS = 7000

describe("spinTicks", () => {
  it("schedules ordered ticks inside the spin", () => {
    const ticks = spinTicks(SPIN_MS)

    expect(ticks.length).toBeGreaterThan(20)
    expect(ticks[0].atMs).toBe(0)
    for (const [index, tick] of ticks.entries()) {
      expect(tick.atMs).toBeGreaterThanOrEqual(0)
      expect(tick.atMs).toBeLessThanOrEqual(SPIN_MS)
      if (index > 0) expect(tick.atMs).toBeGreaterThan(ticks[index - 1].atMs)
    }
  })

  it("stretches the ticks out as the reel decelerates", () => {
    const ticks = spinTicks(SPIN_MS)
    const gaps = ticks
      .slice(1)
      .map((tick, index) => tick.atMs - ticks[index].atMs)

    expect(gaps[0]).toBeLessThan(60)
    expect(gaps.at(-1)).toBeGreaterThan(gaps[0] * 3)
  })

  it("fades the ticks out towards the end", () => {
    const ticks = spinTicks(SPIN_MS)
    const first = ticks[0].gain
    const last = ticks.at(-1)?.gain ?? 0

    expect(last).toBeGreaterThan(0)
    expect(last).toBeLessThan(first)
  })

  it("caps the schedule so a long spin cannot flood the audio graph", () => {
    expect(spinTicks(10 * 60 * 1000).length).toBeLessThanOrEqual(240)
  })

  it("ignores durations that cannot be scheduled", () => {
    expect(spinTicks(0)).toEqual([])
    expect(spinTicks(-1)).toEqual([])
    expect(spinTicks(Number.NaN)).toEqual([])
    expect(spinTicks(Number.POSITIVE_INFINITY)).toEqual([])
  })
})

describe("createWheelSpinSound without Web Audio", () => {
  it("reports no support and stays silent instead of throwing", () => {
    expect(isWheelSpinSoundSupported()).toBe(false)

    const sound = createWheelSpinSound()
    expect(() => {
      sound.start(SPIN_MS)
      sound.celebrate()
      sound.stop()
      sound.dispose()
    }).not.toThrow()
  })
})
