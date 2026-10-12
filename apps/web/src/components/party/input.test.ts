import { describe, expect, it } from "vitest"
import { createPartyInput, readScreenControls } from "./input"

describe("party input", () => {
  it("holds movement and jump together and preserves a quick jump tap", () => {
    const input = createPartyInput()
    input.press("finger:1", "right")
    input.press("finger:2", "jump")
    input.release("finger:2")
    expect(input.held("right")).toBe(true)
    expect(input.held("jump")).toBe(false)
    expect(input.consume("jump")).toBe(true)
    expect(input.consume("jump")).toBe(false)
    expect(input.snapshot()).toEqual({
      left: false,
      right: true,
      heldJump: false,
      jump: 1,
      drop: 0,
    })
  })
  it("does not release a direction another pointer or key still holds", () => {
    const input = createPartyInput()
    input.press("pointer:1", "left")
    input.press("key:a", "left")
    input.release("pointer:1")
    expect(input.held("left")).toBe(true)
    input.release("key:a")
    expect(input.held("left")).toBe(false)
  })
  it("ignores repeats and clears held and queued actions on cancellation", () => {
    const input = createPartyInput()
    input.press("key:w", "jump")
    input.press("key:w", "jump")
    input.press("pointer:3", "drop")
    expect(input.snapshot().jump).toBe(1)
    input.clear()
    expect(input.held("jump")).toBe(false)
    expect(input.consume("jump")).toBe(false)
    expect(input.consume("drop")).toBe(false)
    expect(input.snapshot().drop).toBe(1)
  })
})

describe("central screen input", () => {
  it("releases held buttons after a missing heartbeat without replaying old jumps", () => {
    const counters = { lastJump: 0, lastDrop: 0 }
    const received = {
      receivedAt: 100,
      input: { left: true, right: false, heldJump: true, jump: 1, drop: 1 },
    }
    expect(readScreenControls(received, counters, 1099)).toEqual({
      left: true,
      right: false,
      heldJump: true,
      jumpQueued: true,
      dropQueued: true,
    })
    expect(readScreenControls(received, counters, 1100)).toEqual({
      left: false,
      right: false,
      heldJump: false,
      jumpQueued: false,
      dropQueued: false,
    })
    expect(
      readScreenControls({ ...received, receivedAt: 1200 }, counters, 1200)
        .jumpQueued,
    ).toBe(false)
  })
  it("preserves two jump taps between heartbeats for a double jump", () => {
    const counters = { lastJump: 0, lastDrop: 0 }
    const received = {
      receivedAt: 0,
      input: { left: false, right: true, heldJump: false, jump: 2, drop: 0 },
    }
    expect(readScreenControls(received, counters, 10).jumpQueued).toBe(true)
    expect(readScreenControls(received, counters, 26).jumpQueued).toBe(true)
    expect(readScreenControls(received, counters, 42).jumpQueued).toBe(false)
  })
})
