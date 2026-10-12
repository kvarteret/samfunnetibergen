"use client"

import {
  type ClientMessage,
  type Mascot,
  type PlayerState,
  parseServerMessage,
  roomForPath,
} from "@samfunnet/party/protocol"
import { PartySocket } from "partysocket"
import { useEffect, useRef, useState } from "react"

// "Spill med andre": visitors on the same page see each other's steered
// mascot. The lekeplass server lives in apps/party; without a host the
// option is not offered at all.
const PLAYGROUND_HOST = process.env.NEXT_PUBLIC_PARTY_HOST ?? ""
export const multiplayerAvailable = PLAYGROUND_HOST !== ""

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

  useEffect(() => {
    if (!enabled || !multiplayerAvailable) return

    const states = new Map<string, PlayerState>()
    const socket = new PartySocket({
      host: PLAYGROUND_HOST,
      party: "lekeplass",
      room: roomForPath(pathname),
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
  }, [enabled, pathname])

  return { players, playground }
}

// A steady colour per player, for the marker above their mascot.
export function playerHue(id: string) {
  let hash = 0
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return hash % 360
}
