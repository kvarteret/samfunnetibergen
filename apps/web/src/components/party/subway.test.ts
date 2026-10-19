import { describe, expect, it } from "vitest"
import { newGame, step } from "./subway"

const none = { left: false, right: false, jump: false, drop: false }
const base = { ...newGame(), nextSpawn: 99 }

describe("subway step", () => {
  it("changes lane and clamps at the edges", () => {
    let s = step(newGame(), { ...none, left: true }, 0.016)
    expect(s.lane).toBe(0)
    s = step(s, { ...none, left: true }, 0.016)
    expect(s.lane).toBe(0)
    expect(s.facing).toBe("left")
  })

  it("dies on a train or low barrier but clears them by jumping or sliding", () => {
    const train = {
      ...base,
      obstacles: [{ id: 1, lane: 1, z: 0.3, kind: "train" as const, len: 12 }],
    }
    expect(step(train, none, 0.001).dead).toBe(true)
    const barrier = {
      ...base,
      obstacles: [{ id: 1, lane: 1, z: 0.3, kind: "barrier" as const, len: 1 }],
    }
    expect(step(barrier, none, 0.001).dead).toBe(true)
    expect(step({ ...barrier, y: 2 }, none, 0.001).dead).toBe(false)
    const beam = {
      ...base,
      obstacles: [{ id: 1, lane: 1, z: 0.3, kind: "low" as const, len: 1 }],
    }
    expect(step(beam, none, 0.001).dead).toBe(true)
    expect(step(beam, { ...none, drop: true }, 0.001).dead).toBe(false)
  })

  it("keeps killing while inside a long train", () => {
    const train = {
      ...base,
      obstacles: [{ id: 1, lane: 1, z: -5, kind: "train" as const, len: 12 }],
    }
    expect(step(train, none, 0.001).dead).toBe(true)
    expect(step({ ...train, lane: 0 }, none, 0.001).dead).toBe(false)
  })

  it("collects coins in the runner's lane", () => {
    const s = step(
      { ...base, pickups: [{ id: 1, lane: 1, z: 0.2 }] },
      none,
      0.001,
    )
    expect(s.coins).toBe(1)
    expect(s.pickups).toHaveLength(0)
  })

  it("needs a double jump to land on a train roof", () => {
    const train = { id: 1, lane: 1, z: 2, kind: "train" as const, len: 12 }
    const ahead = { ...base, obstacles: [train] }
    // Standing on the ground the train front kills; a single jump peaks too low.
    let s = step({ ...ahead, obstacles: [{ ...train, z: 0.3 }] }, none, 0.001)
    expect(s.dead).toBe(true)
    s = {
      ...ahead,
      obstacles: [{ ...train, z: 0.3 }],
      y: 3.5,
      vy: -1,
      jumps: 2,
    }
    s = step(s, none, 0.2)
    expect(s.dead).toBe(false)
    s = step(s, none, 0.5)
    expect(s.y).toBe(2.8)
    expect(s.dead).toBe(false)
  })

  it("allows exactly one extra jump in the air", () => {
    let s = step(base, { ...none, jump: true }, 0.016)
    expect(s.jumps).toBe(1)
    s = step(s, none, 0.4)
    expect(s.vy).toBeLessThan(0)
    s = step(s, { ...none, jump: true }, 0.016)
    expect(s.jumps).toBe(2)
    expect(s.vy).toBeGreaterThan(0)
    const rising = s.vy
    s = step(s, { ...none, jump: true }, 0.016)
    expect(s.vy).toBeLessThan(rising)
  })

  it("falls off the roof when the train ends", () => {
    const train = { id: 1, lane: 1, z: -13, kind: "train" as const, len: 12 }
    const s = step({ ...base, obstacles: [train], y: 2.8 }, none, 0.1)
    expect(s.y).toBeLessThan(2.8)
    expect(s.dead).toBe(false)
  })
})
