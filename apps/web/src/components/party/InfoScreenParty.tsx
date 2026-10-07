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

export function isScreenPartyTime(now: Date) {
  return now.getMinutes() % PARTY_EVERY_MINUTES < PARTY_FOR_MINUTES
}

export function isScreenMushroomShow(now: Date) {
  const show = Math.floor(now.getTime() / (PARTY_EVERY_MINUTES * 60_000))
  return show % MUSHROOM_EVERY_SHOWS === 0
}

export function InfoScreenParty({ stage }: { stage: string }) {
  const [show, setShow] = useState<{ mushroom: boolean } | null>(null)

  useEffect(() => {
    // `?party` keeps them out permanently, with a mushroom, for checking the
    // screen.
    const always = new URLSearchParams(window.location.search).has("party")
    const update = () => {
      const now = new Date()
      const active = always || isScreenPartyTime(now)
      const mushroom = always || isScreenMushroomShow(now)
      setShow(current =>
        !active
          ? null
          : current?.mushroom === mushroom
            ? current
            : { mushroom },
      )
    }
    update()
    const interval = window.setInterval(update, 5_000)
    return () => window.clearInterval(interval)
  }, [])

  if (!show) return null
  return (
    <PartyCritters
      mushrooms={show.mushroom ? "once" : "off"}
      settings={SCREEN_PARTY}
      stage={stage}
    />
  )
}
