"use client"

import { useEffect, useState } from "react"

import {
  type ClosedDate,
  isHouseClosed,
  isOpenAt,
  isoDate,
  type OpeningHours,
} from "@/lib/opening-hours"

export interface OpenStatusRoom {
  openingHours?: OpeningHours | null
}

interface OpenStatusProps {
  rooms: OpenStatusRoom[]
  houseClosedDates?: ClosedDate[] | null
  variant?: "status" | "announcement"
}

export function OpenStatus({
  rooms,
  houseClosedDates,
  variant = "status",
}: OpenStatusProps) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(interval)
  }, [])

  if (isHouseClosed(isoDate(now), houseClosedDates)) {
    if (variant === "announcement") return null
  }

  const isOpen = rooms.some(room =>
    isOpenAt(now, room.openingHours, houseClosedDates),
  )

  if (variant === "announcement") {
    if (!isOpen) return null
    return (
      <p className="mt-2 font-heading text-xs uppercase tracking-[0.18em] text-primary">
        er åpent!!
      </p>
    )
  }

  return (
    <p
      className={isOpen ? "text-xs text-primary" : "text-xs text-foreground/45"}
    >
      {isOpen ? "Åpen nå" : "Stengt nå"}
    </p>
  )
}
