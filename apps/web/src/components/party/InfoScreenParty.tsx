"use client"

import { useEffect, useRef, useState } from "react"

import type { PartySettings } from "@/lib/party-mode"
import { createPartyInput, type PartyAction } from "./input"
import { PartyAnimal, PartyCritters } from "./PartyMode"
import { type NamedPlayer, playerFromSearch } from "./player"
import { useScreenRoom } from "./screen-playground"
import { TouchControls } from "./TouchControls"

// Ambient animals remain independent of centrally controlled player animals.
const SCREEN_PARTY: PartySettings = {
  enabled: true,
  leash: false,
  control: null,
  multiplayer: false,
}

// The mascots come out for the first two minutes of every quarter hour, and
// every fifth show a fluesopp sprouts.
const PARTY_EVERY_MINUTES = 15
const PARTY_FOR_MINUTES = 2
const MUSHROOM_EVERY_SHOWS = 5
// The screen runs unattended, so the on/off flag is re-read regularly.
const FLAG_URL = "/api/infoskjerm/party"
const FLAG_POLL_MS = 60_000

export function isScreenPartyTime(now: Date) {
  return now.getMinutes() % PARTY_EVERY_MINUTES < PARTY_FOR_MINUTES
}

export function isScreenMushroomShow(now: Date) {
  const show = Math.floor(now.getTime() / (PARTY_EVERY_MINUTES * 60_000))
  return show % MUSHROOM_EVERY_SHOWS === 0
}

// Whether the mascots are switched on in PostHog. Anything other than a
// clear yes, including a failed request, counts as off.
function useInfoScreenPartyFlag() {
  const [flags, setFlags] = useState({ enabled: false, multiplayer: false })

  useEffect(() => {
    let cancelled = false
    const check = async () => {
      let next = {
        enabled: false,
        multiplayer: process.env.NODE_ENV === "development",
      }
      try {
        const response = await fetch(FLAG_URL, {
          cache: "no-store",
          signal: AbortSignal.timeout(5000),
        })
        if (response.ok) {
          const body: unknown = await response.json()
          if (typeof body === "object" && body !== null) {
            const values = body as { enabled?: unknown; multiplayer?: unknown }
            next = {
              enabled: values.enabled === true,
              multiplayer:
                process.env.NODE_ENV === "development" ||
                values.multiplayer === true,
            }
          }
        }
      } catch {}
      if (!cancelled) setFlags(next)
    }
    check()
    const interval = window.setInterval(check, FLAG_POLL_MS)
    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [])

  return flags
}

export function InfoScreenParty({ stage }: { stage: string }) {
  const flags = useInfoScreenPartyFlag()
  const [player, setPlayer] = useState<NamedPlayer | null>(null)
  const [queryRead, setQueryRead] = useState(false)
  const input = useRef(createPartyInput()).current
  const { players, inputs, status } = useScreenRoom(
    player,
    queryRead && flags.multiplayer,
    input,
  )
  const [show, setShow] = useState<{
    mushroom: boolean
    forced: boolean
  } | null>(null)

  useEffect(() => {
    // `?party` keeps them out permanently, with a mushroom, for checking the
    // screen. It skips the schedule and the flag.
    setPlayer(playerFromSearch(window.location.search))
    setQueryRead(true)
    const always = new URLSearchParams(window.location.search).has("party")
    const update = () => {
      const now = new Date()
      const active = always || isScreenPartyTime(now)
      const mushroom = always || isScreenMushroomShow(now)
      setShow(current =>
        !active
          ? null
          : current?.mushroom === mushroom && current.forced === always
            ? current
            : { mushroom, forced: always },
      )
    }
    update()
    const interval = window.setInterval(update, 5_000)
    return () => window.clearInterval(interval)
  }, [])

  if (player)
    return (
      <InfoScreenController player={player} input={input} status={status} />
    )
  const ambient = Boolean(show && (flags.enabled || show.forced))
  if (!ambient && players.length === 0) return null
  return (
    <PartyCritters
      mushrooms={ambient && show?.mushroom ? "once" : "off"}
      settings={SCREEN_PARTY}
      stage={stage}
      ambient={ambient}
      screenPlayers={players}
      screenInputs={inputs}
    />
  )
}

function InfoScreenController({
  player,
  input,
  status,
}: {
  player: NamedPlayer
  input: ReturnType<typeof createPartyInput>
  status: "connecting" | "ready" | "unavailable"
}) {
  useEffect(() => {
    const actions: Record<string, PartyAction> = {
      ArrowLeft: "left",
      a: "left",
      ArrowRight: "right",
      d: "right",
      ArrowUp: "jump",
      w: "jump",
      " ": "jump",
      ArrowDown: "drop",
      s: "drop",
    }
    const down = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return
      if (
        event.target instanceof Element &&
        event.target.closest(
          "input, textarea, select, [contenteditable], [data-party-controls]",
        )
      )
        return
      const action =
        actions[event.key.length === 1 ? event.key.toLowerCase() : event.key]
      if (!action) return
      event.preventDefault()
      if (!event.repeat) input.press(`key:${event.key}`, action)
    }
    const up = (event: KeyboardEvent) => input.release(`key:${event.key}`)
    const reset = () => input.clear()
    const visibility = () => {
      if (document.hidden) reset()
    }
    window.addEventListener("keydown", down)
    window.addEventListener("keyup", up)
    window.addEventListener("blur", reset)
    document.addEventListener("visibilitychange", visibility)
    return () => {
      reset()
      window.removeEventListener("keydown", down)
      window.removeEventListener("keyup", up)
      window.removeEventListener("blur", reset)
      document.removeEventListener("visibilitychange", visibility)
    }
  }, [input])
  return (
    <div className="party-screen-controller">
      <PartyAnimal mascot={player.mascot} />
      <p className="font-heading text-3xl">
        {player.mascot === "pingvin" ? "Pingvin" : "Pinnsvin"}
      </p>
      <p role="status">
        {status === "ready"
          ? "Du styrer dyret på infoskjermen."
          : status === "connecting"
            ? "Kobler til infoskjermen …"
            : "Infoskjermen er ikke tilgjengelig."}
      </p>
      <p className="text-sm">
        Hold pilene for å bevege deg. Trykk ↑ igjen for dobbelthopp.
      </p>
      <TouchControls input={input} />
    </div>
  )
}
