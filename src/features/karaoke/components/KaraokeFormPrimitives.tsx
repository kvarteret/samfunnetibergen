"use client"

import { type ReactNode } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { isoDate } from "@/lib/opening-hours"
import { KARAOKE_DATE_COUNT } from "../domain/availability"

export function KaraokeSelect({
  children,
  id,
  value,
  onChange,
}: {
  children: ReactNode
  id: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="relative max-w-[180px]">
      <select
        className="w-full appearance-none border-2 border-border bg-background px-3 py-2 pr-9 text-sm font-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        id={id}
        onChange={event => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-foreground/50"
      />
    </div>
  )
}

export function buildKaraokeDates(today: string): string[] {
  return Array.from({ length: KARAOKE_DATE_COUNT }, (_, index) => {
    const date = new Date(today)
    date.setDate(date.getDate() + index)
    return isoDate(date)
  })
}

export function getDateButtonClass(
  isSelected: boolean,
  available: boolean,
  isToday: boolean,
): string {
  if (isSelected) return "bg-primary border-primary text-primary-foreground"
  if (available)
    return cn(
      "border-border hover:bg-muted cursor-pointer",
      isToday && "border-primary/50",
    )
  return "border-border/30 text-foreground/25 cursor-not-allowed"
}

export function getSlotButtonClass(
  isSelected: boolean,
  taken: boolean,
): string {
  if (isSelected) return "bg-primary border-primary text-primary-foreground"
  if (taken) return "border-border/30 text-foreground/25 cursor-not-allowed"
  return "border-border hover:bg-muted"
}
