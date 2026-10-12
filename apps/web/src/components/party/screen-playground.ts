"use client"

import {
  HEALTH_PATH,
  INFOSCREEN_ROOM,
  parseScreenServerMessage,
  type ScreenPlayer,
} from "@samfunnet/party/protocol"
import { PartySocket } from "partysocket"
import { useEffect, useRef, useState } from "react"
import type { PartyInput, ReceivedInput } from "./input"
import type { NamedPlayer } from "./player"

const HOST = process.env.NEXT_PUBLIC_PARTY_HOST ?? ""
const ORIGIN = `${/^(localhost|127\.0\.0\.1)(:|$)/.test(HOST) ? "http" : "https"}://${HOST}`
export function useScreenRoom(
  player: NamedPlayer | null,
  enabled: boolean,
  input: PartyInput,
) {
  const [players, setPlayers] = useState<ScreenPlayer[]>([])
  const [status, setStatus] = useState<"connecting" | "ready" | "unavailable">(
    "connecting",
  )
  const inputs = useRef(new Map<string, ReceivedInput>())

  useEffect(() => {
    if (!enabled || !HOST) {
      setStatus("unavailable")
      return
    }
    let cancelled = false
    let socket: PartySocket | undefined
    let timer: number | undefined
    let failed = 0
    setStatus("connecting")
    const connect = async () => {
      try {
        const response = await fetch(`${ORIGIN}${HEALTH_PATH}`, {
          cache: "no-store",
          signal: AbortSignal.timeout(4000),
        })
        if (!response.ok) throw new Error("health")
        if (cancelled) return
        socket = new PartySocket({
          host: HOST,
          party: "lekeplass",
          room: INFOSCREEN_ROOM,
        })
        socket.addEventListener("open", () => {
          failed = 0
          socket?.send(
            JSON.stringify(
              player ? { type: "join", ...player } : { type: "screen" },
            ),
          )
        })
        socket.addEventListener("close", event => {
          if (cancelled) return
          input.clear()
          inputs.current.clear()
          setPlayers([])
          setStatus("connecting")
          failed += 1
          if (event.code === 1013 || failed >= 3) {
            socket?.close()
            setStatus("unavailable")
          }
        })
        socket.addEventListener("message", event => {
          const message = parseScreenServerMessage(event.data)
          if (!message) return
          if (message.type === "players") {
            const present = new Set(message.players.map(p => p.id))
            for (const id of inputs.current.keys()) {
              if (!present.has(id)) inputs.current.delete(id)
            }
            for (const p of message.players)
              if (!inputs.current.has(p.id))
                inputs.current.set(p.id, {
                  input: p.input,
                  receivedAt: performance.now(),
                })
            setPlayers(message.players)
            setStatus("ready")
          } else if (message.type === "input") {
            inputs.current.set(message.id, {
              input: message.input,
              receivedAt: performance.now(),
            })
          } else if (message.type === "screen-status") {
            setStatus(message.available ? "ready" : "unavailable")
          }
        })
        // A heartbeat lets the screen release held buttons if a phone sleeps
        // or loses its network before its socket disconnect is delivered.
        if (player)
          timer = window.setInterval(() => {
            if (socket?.readyState === WebSocket.OPEN)
              socket.send(
                JSON.stringify({ type: "input", input: input.snapshot() }),
              )
          }, 66)
      } catch {
        if (!cancelled) setStatus("unavailable")
      }
    }
    void connect()
    return () => {
      cancelled = true
      window.clearInterval(timer)
      socket?.close()
      input.clear()
      inputs.current.clear()
      setPlayers([])
    }
  }, [player, enabled, input])

  return { players, inputs, status }
}
