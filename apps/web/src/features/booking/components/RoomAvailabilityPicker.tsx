"use client"

import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import type { CresatBooking } from "@/lib/integrations/crescat/calendar"
import {
  type ClosedDate,
  isoDate,
  type OpeningHours,
  type VacationMode,
} from "@/lib/opening-hours"
import { fetchRoomAvailability } from "../actions/room-availability"
import {
  availabilityWindow,
  findRoomConflicts,
  occupiedMinuteRanges,
} from "../domain/availability"

interface RoomAvailabilityPickerProps {
  crescatRoomId: number
  bookableHours: OpeningHours | null
  roomOpeningHours: OpeningHours | null
  closedDates: ClosedDate[]
  vacationMode?: VacationMode | null
  initialNow: string
}

export function RoomAvailabilityPicker({
  crescatRoomId,
  bookableHours,
  roomOpeningHours,
  closedDates,
  vacationMode,
  initialNow,
}: RoomAvailabilityPickerProps) {
  const locale = useLocale()
  const t = useTranslations("RoomPage")
  const today = isoDate(new Date(initialNow))
  const [startDate, setStartDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [visibleMonth, setVisibleMonth] = useState(`${today.slice(0, 7)}-01`)
  const [bookings, setBookings] = useState<CresatBooking[]>([])

  const { start, end } = availabilityWindow(visibleMonth, startDate, "")

  useEffect(() => {
    let active = true
    fetchRoomAvailability("ekstern", start, end).then(result => {
      if (active) setBookings(result)
    })
    return () => {
      active = false
    }
  }, [start, end])

  const roomBookings = bookings.filter(
    booking => booking.resourceId === crescatRoomId,
  )

  const hasValidSegment =
    Boolean(startDate && startTime && endTime) &&
    findRoomConflicts(
      roomBookings,
      crescatRoomId,
      startDate,
      startTime,
      startDate,
      endTime,
    ).length === 0

  const bookingParams = new URLSearchParams({
    room: String(crescatRoomId),
    date: startDate,
    start: startTime,
    end: endTime,
  })

  return (
    <div className="space-y-6">
      <section className="max-w-4xl space-y-4">
        <h2 className="font-heading text-lg text-foreground">
          {t("availability")}
        </h2>
        <DateTimePicker
          allowMultiDay={false}
          showRoomAvailability
          calendarBookings={roomBookings}
          closedDates={closedDates}
          endDate=""
          endTime={endTime}
          occupiedRanges={occupiedMinuteRanges(
            roomBookings,
            [crescatRoomId],
            startDate,
            "",
          )}
          onEndChange={setEndTime}
          onEndDateChange={() => {}}
          onStartChange={setStartTime}
          onStartDateChange={date => {
            setStartDate(date)
            setStartTime("")
            setEndTime("")
          }}
          onVisibleMonthChange={setVisibleMonth}
          openingHours={bookableHours}
          roomOpeningHours={roomOpeningHours}
          startDate={startDate}
          startTime={startTime}
          today={today}
          vacationMode={vacationMode}
        />
      </section>
      {hasValidSegment ? (
        <Button
          className="w-fit"
          render={
            <Link
              href={`/${locale}/rom/book?${bookingParams.toString()}#booking-event`}
            />
          }
          size="lg"
        >
          {t("book")}
        </Button>
      ) : (
        <Button
          className="w-fit bg-muted text-foreground-muted shadow-none"
          disabled
          size="lg"
        >
          {t("book")}
        </Button>
      )}
    </div>
  )
}
