"use client"

import { useEffect, useState } from "react"

import type { PartySettings } from "@/lib/party-mode"
import { PartyCritters } from "./PartyMode"

// The screen always has partymodus on; nobody is there to steer or leash.
const SCREEN_PARTY: PartySettings = {
  enabled: true,
  leash: false,
  control: null,
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
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    let cancelled = false
    const check = async () => {
      let next = false
      try {
        const response = await fetch(FLAG_URL, { cache: "no-store" })
        if (response.ok) {
          const body: unknown = await response.json()
          next =
            typeof body === "object" &&
            body !== null &&
            (body as { enabled?: unknown }).enabled === true
        }
      } catch {}
      if (!cancelled) setEnabled(next)
    }
    check()
    const interval = window.setInterval(check, FLAG_POLL_MS)
    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [])

  return enabled
}

export function InfoScreenParty({ stage }: { stage: string }) {
  const flagEnabled = useInfoScreenPartyFlag()
  const [show, setShow] = useState<{
    mushroom: boolean
    forced: boolean
  } | null>(null)

  useEffect(() => {
    // `?party` keeps them out permanently, with a mushroom, for checking the
    // screen. It skips the schedule and the flag.
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

  if (!show || !(flagEnabled || show.forced)) return null
  return (
    <PartyCritters
      mushrooms={show.mushroom ? "once" : "off"}
      settings={SCREEN_PARTY}
      stage={stage}
    />
  )
}
