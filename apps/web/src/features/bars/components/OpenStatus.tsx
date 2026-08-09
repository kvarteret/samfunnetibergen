"use client"

import { Tag } from "@/components/ui/tag"
import {
  type ClosedDate,
  isHouseClosed,
  isOpenAtForCombinedHours,
  isoDate,
  type OpeningHours,
  type VacationMode,
} from "@/lib/opening-hours"
import { useCurrentTime } from "@/lib/use-current-time"

export interface OpenStatusRoom {
  openingHours?: OpeningHours | null
}

interface OpenStatusProps {
  rooms: OpenStatusRoom[]
  houseClosedDates?: ClosedDate[] | null
  operationsManagerHours?: OpeningHours | null
  vacationMode?: VacationMode | null
  variant?: "status" | "announcement"
  initialNow: string
}

export function OpenStatus({
  rooms,
  houseClosedDates,
  operationsManagerHours,
  vacationMode,
  variant = "status",
  initialNow,
}: OpenStatusProps) {
  const now = useCurrentTime(initialNow)

  if (isHouseClosed(isoDate(now), houseClosedDates, vacationMode)) {
    if (variant === "announcement") return null
  }

  const isOpen = rooms.some(room =>
    isOpenAtForCombinedHours(
      now,
      operationsManagerHours,
      room.openingHours,
      houseClosedDates,
      vacationMode,
    ),
  )

  if (variant === "announcement") {
    if (!isOpen) return null
    return (
      <p className="mt-2 font-heading uppercase tracking-widest text-primary">
        er åpent!!
      </p>
    )
  }

  return (
    <Tag variant={isOpen ? "success" : "outline"}>
      {isOpen ? "Åpent nå" : "Stengt nå"}
    </Tag>
  )
}
