"use client"

import {
  type ClientMessage,
  HEALTH_PATH,
  type Mascot,
  type PlayerState,
  parseServerMessage,
  roomForPath,
} from "@samfunnet/party/protocol"
import { PartySocket } from "partysocket"
import posthog from "posthog-js"
import { useEffect, useRef, useState, useSyncExternalStore } from "react"

// "Spill med andre": visitors on the same page see each other's steered
// mascot. The lekeplass server lives in apps/party.
const PLAYGROUND_HOST = process.env.NEXT_PUBLIC_PARTY_HOST ?? ""
// partysocket talks plain ws to a local server, so the health check does too.
const PLAYGROUND_ORIGIN = `${
  /^(localhost|127\.0\.0\.1)(:|$)/.test(PLAYGROUND_HOST) ? "http" : "https"
}://${PLAYGROUND_HOST}`
const HEALTH_TIMEOUT_MS = 4000
// PostHog switch for the whole feature. Turning it off withdraws the option
// and disconnects everyone on their next flag reload.
export const MULTIPLAYER_FLAG = "partymodus-spill-med-andre"
const FLAG_TIMEOUT_MS = 5000
// Failed connection attempts in a row before giving up for this visit.
const MAX_FAILED_CONNECTS = 3
// The server closes with this when a room is full.
const ROOM_FULL = 1013

// The option fails closed: it is only offered once the server has answered
// a health check and the PostHog flag is on, and is withdrawn for the rest
// of the visit as soon as anything goes wrong. Without a configured host it
// is never offered.
type Status = "unknown" | "checking" | "ok" | "failed"
let status: Status = PLAYGROUND_HOST ? "unknown" : "failed"
const listeners = new Set<() => void>()

function setStatus(next: Status) {
  if (status === next || status === "failed") return
  status = next
  for (const listener of listeners) listener()
}

export function markPlaygroundFailed() {
  setStatus("failed")
}

async function serverHealthy() {
  try {
    const response = await fetch(`${PLAYGROUND_ORIGIN}${HEALTH_PATH}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
    })
    return response.ok
  } catch {
    return false
  }
}

// PostHog does not load on localhost, so local development skips the flag.
// Anywhere else a missing, slow or blocked PostHog counts as off.
function flagEnabled() {
  if (process.env.NODE_ENV === "development") return Promise.resolve(true)
  return new Promise<boolean>(resolve => {
    const timer = window.setTimeout(() => resolve(false), FLAG_TIMEOUT_MS)
    posthog.onFeatureFlags(() => {
      window.clearTimeout(timer)
      const enabled = posthog.isFeatureEnabled(MULTIPLAYER_FLAG) === true
      if (!enabled) markPlaygroundFailed()
      resolve(enabled)
    })
  })
}

export function checkPlayground() {
  if (status !== "unknown") return
  setStatus("checking")
  void Promise.all([serverHealthy(), flagEnabled()]).then(([healthy, on]) =>
    setStatus(healthy && on ? "ok" : "failed"),
  )
}

export const getPlaygroundStatus = () => status

function subscribeStatus(onChange: () => void) {
  listeners.add(onChange)
  return () => {
    listeners.delete(onChange)
  }
}

// Whether "Spill med andre" works right now. Nothing contacts the server
// until `wanted` is true, which is once partymodus is on.
export function usePlaygroundReady(wanted: boolean) {
  const current = useSyncExternalStore(
    subscribeStatus,
    () => status,
    (): Status => "unknown",
  )
  useEffect(() => {
    if (wanted) checkPlayground()
  }, [wanted])
  return current === "ok"
}

// About 15 updates a second is smooth enough once the receiver eases
// toward each one.
const SEND_INTERVAL_MS = 66

export interface RemotePlayer {
  id: string
  mascot: Mascot
}

export interface Playground {
  // Latest state of every other player on the page, updated in place so the
  // animation loop can read it without re-rendering.
  states: Map<string, PlayerState>
  // Called every frame with the local player's mascot, or null when it is
  // not on the page. Only changes are sent.
  publish: (state: PlayerState | null) => void
}

const round = (value: number, digits: number) => {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function compact(state: PlayerState): PlayerState {
  return {
    ...state,
    fx: round(state.fx, 4),
    dy: round(state.dy, 1),
    growth: round(state.growth, 2),
  }
}

const idle: Playground = { states: new Map(), publish: () => {} }

export function usePlayground(enabled: boolean, pathname: string) {
  const [players, setPlayers] = useState<RemotePlayer[]>([])
  const playground = useRef<Playground>(idle)
  const ready = usePlaygroundReady(enabled)

  useEffect(() => {
    if (!enabled || !ready) return

    const states = new Map<string, PlayerState>()
    const socket = new PartySocket({
      host: PLAYGROUND_HOST,
      party: "lekeplass",
      room: roomForPath(pathname),
    })

    let failedConnects = 0
    socket.addEventListener("close", event => {
      if (event.code === ROOM_FULL) {
        markPlaygroundFailed()
        return
      }
      failedConnects += 1
      if (failedConnects >= MAX_FAILED_CONNECTS) markPlaygroundFailed()
    })

    // The roster only changes when someone joins, leaves or swaps mascot,
    // so React re-renders for that and nothing else.
    const syncRoster = () => {
      setPlayers(current => {
        const next = Array.from(states, ([id, { mascot }]) => ({ id, mascot }))
        const same =
          next.length === current.length &&
          next.every(
            (player, i) =>
              player.id === current[i]?.id &&
              player.mascot === current[i]?.mascot,
          )
        return same ? current : next
      })
    }

    socket.addEventListener("message", event => {
      const message = parseServerMessage(event.data)
      if (!message) return
      if (message.type === "welcome") {
        states.clear()
        for (const { id, state } of message.players) states.set(id, state)
      } else if (message.type === "move") {
        states.set(message.id, message.state)
      } else {
        states.delete(message.id)
      }
      syncRoster()
    })

    let pending: PlayerState | null = null
    let sent = ""
    // A reconnect is a new connection to the server, so start over.
    socket.addEventListener("open", () => {
      sent = ""
      failedConnects = 0
    })

    const flush = () => {
      if (socket.readyState !== WebSocket.OPEN) return
      const message: ClientMessage = pending
        ? { type: "move", state: compact(pending) }
        : { type: "rest" }
      const raw = JSON.stringify(message)
      if (raw === sent) return
      // The first message on a connection is never a rest: the server has
      // nothing to take away yet.
      if (sent === "" && message.type === "rest") return
      socket.send(raw)
      sent = raw
    }
    const timer = window.setInterval(flush, SEND_INTERVAL_MS)

    playground.current = {
      states,
      publish: state => {
        pending = state
      },
    }

    return () => {
      window.clearInterval(timer)
      socket.close()
      playground.current = idle
      setPlayers([])
    }
  }, [enabled, ready, pathname])

  return { players, playground }
}

// A steady colour per player, for the marker above their mascot.
export function playerHue(id: string) {
  let hash = 0
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return hash % 360
}
