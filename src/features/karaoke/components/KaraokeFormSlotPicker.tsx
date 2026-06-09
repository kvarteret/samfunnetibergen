"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import {
  minutesToTime,
  type ClosedDate,
  type OpeningHours,
  slotRangesForDate,
} from "@/lib/opening-hours"
import type { CresatBooking } from "@/lib/integrations/crescat/calendar"
import {
  dateHasKaraokeSlot,
  slotOverlapsKaraokeBookings,
} from "../domain/availability"
import {
  buildKaraokeDates,
  getDateButtonClass,
  getSlotButtonClass,
} from "./KaraokeFormPrimitives"

interface KaraokeFormSlotPickerProps {
  bookings: CresatBooking[]
  duration: number
  selectedDate: string
  selectedSlotMin: number | null
  today: string
  operationsManagerHours?: OpeningHours | null
  houseClosedDates?: ClosedDate[] | null
  onDateChange: (date: string) => void
  onSlotChange: (slotMin: number | null) => void
}

export function KaraokeFormSlotPicker({
  bookings,
  duration,
  selectedDate,
  selectedSlotMin,
  today,
  operationsManagerHours,
  houseClosedDates,
  onDateChange,
  onSlotChange,
}: KaraokeFormSlotPickerProps) {
  const dates = useMemo(() => buildKaraokeDates(today), [today])

  return (
    <div className="space-y-4">
      <KaraokeDateScroller
        bookings={bookings}
        dates={dates}
        duration={duration}
        houseClosedDates={houseClosedDates}
        operationsManagerHours={operationsManagerHours}
        selectedDate={selectedDate}
        today={today}
        onDateChange={onDateChange}
      />
      {selectedDate && (
        <KaraokeSlotGrid
          bookings={bookings}
          duration={duration}
          houseClosedDates={houseClosedDates}
          operationsManagerHours={operationsManagerHours}
          selectedDate={selectedDate}
          selectedSlotMin={selectedSlotMin}
          onSlotChange={onSlotChange}
        />
      )}
    </div>
  )
}

function KaraokeDateScroller({
  bookings,
  dates,
  duration,
  selectedDate,
  today,
  operationsManagerHours,
  houseClosedDates,
  onDateChange,
}: {
  bookings: CresatBooking[]
  dates: string[]
  duration: number
  selectedDate: string
  today: string
  operationsManagerHours?: OpeningHours | null
  houseClosedDates?: ClosedDate[] | null
  onDateChange: (date: string) => void
}) {
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1.5 pb-1 min-w-max">
        {dates.map(date => (
          <KaraokeDateButton
            available={dateHasKaraokeSlot(
              date,
              duration,
              bookings,
              operationsManagerHours,
              houseClosedDates,
            )}
            date={date}
            isSelected={date === selectedDate}
            isToday={date === today}
            key={date}
            onClick={() => onDateChange(date)}
          />
        ))}
      </div>
    </div>
  )
}

function KaraokeDateButton({
  available,
  date,
  isSelected,
  isToday,
  onClick,
}: {
  available: boolean
  date: string
  isSelected: boolean
  isToday: boolean
  onClick: () => void
}) {
  const parsedDate = new Date(date)
  const weekday = parsedDate.toLocaleDateString("nb-NO", {
    weekday: "short",
  })
  const month = parsedDate
    .toLocaleDateString("nb-NO", { month: "short" })
    .replace(".", "")

  return (
    <button
      key={date}
      type="button"
      disabled={!available}
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-0.5 px-2.5 py-2 border-2 min-w-[52px] transition-colors shrink-0",
        getDateButtonClass(isSelected, available, isToday),
      )}
    >
      <span className="text-[10px] uppercase tracking-widest">{weekday}</span>
      <span className="text-base font-heading leading-none">
        {parsedDate.getDate()}
      </span>
      <span className="text-[10px]">{month}</span>
    </button>
  )
}

function KaraokeSlotGrid({
  bookings,
  duration,
  selectedDate,
  selectedSlotMin,
  operationsManagerHours,
  houseClosedDates,
  onSlotChange,
}: {
  bookings: CresatBooking[]
  duration: number
  selectedDate: string
  selectedSlotMin: number | null
  operationsManagerHours?: OpeningHours | null
  houseClosedDates?: ClosedDate[] | null
  onSlotChange: (slotMin: number | null) => void
}) {
  const slots = slotRangesForDate(
    selectedDate,
    duration,
    operationsManagerHours,
    houseClosedDates,
  )

  return (
    <div className="space-y-2">
      <p className="text-xs font-heading uppercase tracking-[0.12em] text-foreground/50">
        Velg starttidspunkt
      </p>
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
        {slots.map(slotMin => (
          <KaraokeSlotButton
            date={selectedDate}
            bookings={bookings}
            duration={duration}
            isSelected={selectedSlotMin === slotMin}
            key={slotMin}
            slotMin={slotMin}
            onClick={() => onSlotChange(slotMin)}
          />
        ))}
      </div>
    </div>
  )
}

function KaraokeSlotButton({
  bookings,
  date,
  duration,
  isSelected,
  slotMin,
  onClick,
}: {
  bookings: CresatBooking[]
  date: string
  duration: number
  isSelected: boolean
  slotMin: number
  onClick: () => void
}) {
  const taken = slotOverlapsKaraokeBookings(date, slotMin, duration, bookings)

  return (
    <button
      key={slotMin}
      type="button"
      disabled={taken}
      onClick={onClick}
      className={cn(
        "py-2.5 text-sm font-heading border-2 text-center transition-colors",
        getSlotButtonClass(isSelected, taken),
      )}
    >
      {minutesToTime(slotMin)}
    </button>
  )
}
