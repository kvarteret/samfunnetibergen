"use client"

import { DateScroller } from "@/components/ui/date-scroller"
import { SlotGrid, type SlotOption } from "@/components/ui/slot-grid"
import type { CresatBooking } from "@/lib/integrations/crescat/calendar"
import {
  buildDateSequence,
  type ClosedDate,
  minutesToTime,
  type OpeningHours,
  slotRangesForDate,
} from "@/lib/opening-hours"
import {
  dateHasKaraokeSlot,
  KARAOKE_DATE_COUNT,
  slotOverlapsKaraokeBookings,
} from "../domain/availability"

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
  const dates = buildDateSequence(today, KARAOKE_DATE_COUNT)

  const slotOptions: SlotOption[] = selectedDate
    ? slotRangesForDate(
        selectedDate,
        duration,
        operationsManagerHours,
        houseClosedDates,
      ).map(slotMin => ({
        value: String(slotMin),
        label: minutesToTime(slotMin),
        state: slotOverlapsKaraokeBookings(
          selectedDate,
          slotMin,
          duration,
          bookings,
        )
          ? "taken"
          : "available",
      }))
    : []

  return (
    <div className="space-y-4">
      <DateScroller
        dates={dates}
        getDateState={date => {
          if (date === selectedDate) return "selected"
          return dateHasKaraokeSlot(
            date,
            duration,
            bookings,
            operationsManagerHours,
            houseClosedDates,
          )
            ? "available"
            : "unavailable"
        }}
        onChange={onDateChange}
        selectedDate={selectedDate}
        today={today}
      />
      {selectedDate && slotOptions.length > 0 && (
        <SlotGrid
          onChange={value => onSlotChange(Number(value))}
          selectedValue={
            selectedSlotMin != null ? String(selectedSlotMin) : null
          }
          slots={slotOptions}
        />
      )}
    </div>
  )
}
