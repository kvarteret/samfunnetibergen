import type { ScreenInput } from "@samfunnet/party/protocol"

export type PartyAction = "left" | "right" | "jump" | "drop"

// Each key or pointer owns its press, so releasing one finger cannot cancel
// a second finger (or a keyboard key) holding the same direction.
export function createPartyInput() {
  const sources = new Map<string, PartyAction>()
  const queued = new Set<PartyAction>()
  let jump = 0
  let drop = 0
  return {
    press(source: string, action: PartyAction) {
      if (sources.has(source)) return
      sources.set(source, action)
      if (action === "jump" || action === "drop") queued.add(action)
      if (action === "jump") jump += 1
      if (action === "drop") drop += 1
    },
    release(source: string) {
      sources.delete(source)
    },
    held(action: PartyAction) {
      return Array.from(sources.values()).includes(action)
    },
    consume(action: PartyAction) {
      return queued.delete(action)
    },
    snapshot() {
      const held = new Set(sources.values())
      return {
        left: held.has("left"),
        right: held.has("right"),
        heldJump: held.has("jump"),
        jump,
        drop,
      }
    },
    clear() {
      sources.clear()
      queued.clear()
    },
  }
}

export type PartyInput = ReturnType<typeof createPartyInput>

export interface ReceivedInput {
  input: ScreenInput
  receivedAt: number
}

export function readScreenControls(
  received: ReceivedInput | undefined,
  counters: { lastJump: number; lastDrop: number },
  now: number,
) {
  const active = received && now - received.receivedAt < 1000
  const state = received?.input
  const jumpQueued = Boolean(active && state && state.jump > counters.lastJump)
  const dropQueued = Boolean(active && state && state.drop > counters.lastDrop)
  if (jumpQueued) counters.lastJump += 1
  else if (!active && state) counters.lastJump = state.jump
  if (dropQueued) counters.lastDrop += 1
  else if (!active && state) counters.lastDrop = state.drop
  return {
    left: Boolean(active && state?.left),
    right: Boolean(active && state?.right),
    heldJump: Boolean(active && state?.heldJump),
    jumpQueued,
    dropQueued,
  }
}
