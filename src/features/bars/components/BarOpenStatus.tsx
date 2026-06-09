"use client"

import { useEffect, useState } from "react"

import {
  type ClosedDate,
  isOpenAt,
  type OpeningHours,
} from "@/lib/opening-hours"

interface BarOpenStatusProps {
  hours?: OpeningHours | null
  houseClosedDates?: ClosedDate[] | null
}

export function BarOpenStatus({ hours, houseClosedDates }: BarOpenStatusProps) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(interval)
  }, [])

  if (!hours?.rows?.length) return null

  const isOpen = isOpenAt(now, hours, houseClosedDates)

  return (
    <p
      className={isOpen ? "text-xs text-primary" : "text-xs text-foreground/45"}
    >
      {isOpen ? "Åpen nå" : "Stengt nå"}
    </p>
  )
}
