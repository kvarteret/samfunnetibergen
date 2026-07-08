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
  type VacationMode,
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
  vacationMode?: VacationMode | null
  onDateChange: (date: string) => void
  onSlotChange: (slotMin: number | null) => void
  id?: string
  "aria-describedby"?: string
  "aria-invalid"?: boolean
}

export function KaraokeFormSlotPicker({
  bookings,
  duration,
  selectedDate,
  selectedSlotMin,
  today,
  operationsManagerHours,
  houseClosedDates,
  vacationMode,
  onDateChange,
  onSlotChange,
  id,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
}: KaraokeFormSlotPickerProps) {
  const dates = buildDateSequence(today, KARAOKE_DATE_COUNT)

  const slotOptions: SlotOption[] = selectedDate
    ? slotRangesForDate(
        selectedDate,
        duration,
        operationsManagerHours,
        houseClosedDates,
        vacationMode,
      ).map(slotMin => ({
        value: String(slotMin),
        label: minutesToTime(slotMin),
        availability: slotOverlapsKaraokeBookings(
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
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        dates={dates}
        getDateAvailability={date =>
          dateHasKaraokeSlot(
            date,
            duration,
            bookings,
            operationsManagerHours,
            houseClosedDates,
            vacationMode,
          )
            ? "available"
            : "unavailable"
        }
        id={id}
        onValueChange={onDateChange}
        selectedDate={selectedDate}
        today={today}
      />
      {selectedDate && slotOptions.length > 0 && (
        <SlotGrid
          onValueChange={value => onSlotChange(Number(value))}
          value={selectedSlotMin != null ? String(selectedSlotMin) : null}
          slots={slotOptions}
        />
      )}
    </div>
  )
}
