"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Building2, CalendarClock, Check } from "lucide-react"
import { useId, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { DateScroller } from "@/components/ui/date-scroller"
import {
  CheckboxField,
  FieldGroup,
  FieldHint,
  FormSection,
} from "@/components/ui/form-fields"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import { Label } from "@/components/ui/label"
import { RoomCapacity } from "@/components/ui/room-capacity"
import { SelectableCard } from "@/components/ui/selectable-card"
import type { CresatBooking } from "@/lib/integrations/crescat/calendar"
import {
  buildDateSequence,
  type ClosedDate,
  combinedSlotRangesForDate,
  hasOpeningHoursRows,
  isoDate,
  type OpeningHours,
} from "@/lib/opening-hours"
import { cn } from "@/lib/utils"
import {
  durationHoursBetween,
  formatBookingTime,
  overlaps,
} from "../domain/availability"
import type { BookerType } from "../domain/formState"
import { isExternalBooker } from "../domain/formState"
import type { BookingRoom } from "../types"
import { BookingFormTimeSlotPicker } from "./BookingFormTimeSlotPicker"
import { useBookingForm } from "./bookingFormContext"

const DATE_COUNT = 7
const MINUTES_IN_DAY = 24 * 60

interface BookingFormScheduleSectionProps {
  rooms: BookingRoom[]
  occupiedSlugs: Set<string>
  roomBookings: CresatBooking[]
  selectedDateRoomBookings: CresatBooking[]
  hasConflict: boolean
  selectedRoomTitle?: string
  selectedRoom?: BookingRoom
  openingHours: OpeningHours | null
  closedDates: ClosedDate[]
}

export function BookingFormScheduleSection({
  rooms,
  occupiedSlugs,
  roomBookings,
  selectedDateRoomBookings,
  hasConflict,
  selectedRoomTitle,
  selectedRoom,
  openingHours,
  closedDates,
}: BookingFormScheduleSectionProps) {
  const uid = useId()
  const form = useBookingForm()

  const today = useMemo(() => isoDate(new Date()), [])
  const dates = useMemo(() => buildDateSequence(today, DATE_COUNT), [today])

  return (
    <FormSection number="02" title="Rom og tidspunkt">
      <form.Subscribe
        selector={(s: any) => ({
          roomSlug: s.values.roomSlug,
          startDate: s.values.startDate,
          startTime: s.values.startTime,
          endTime: s.values.endTime,
          doorsTime: s.values.doorsTime,
          bookerType: s.values.bookerType,
        })}
      >
        {({
          roomSlug,
          startDate,
          startTime,
          endTime,
          doorsTime,
          bookerType,
        }: {
          roomSlug: string
          startDate: string
          startTime: string
          endTime: string
          doorsTime: string
          bookerType: BookerType
        }) => {
          const durationHours =
            startTime && endTime ? durationHoursBetween(startTime, endTime) : 1

          return (
            <>
              {rooms.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {rooms.map(room => {
                    const selected = roomSlug === room.slug
                    const occupied = occupiedSlugs.has(room.slug)
                    return (
                      <SelectableCard
                        className="hover:border-primary"
                        disabled={occupied}
                        image={
                          <div className="relative aspect-[16/9] bg-muted">
                            <ImageWithFallback
                              alt={room.image?.alt ?? room.title ?? room.slug}
                              fallback={
                                <Building2
                                  aria-hidden
                                  className="size-8 text-foreground/30"
                                />
                              }
                              sizes="(min-width: 1280px) 25vw, (min-width: 768px) 40vw, 100vw"
                              src={room.image?.assetUrl}
                            />
                            {selected && !occupied && (
                              <span className="absolute right-3 top-3 flex size-7 items-center justify-center bg-primary text-primary-foreground">
                                <Check aria-hidden className="size-4" />
                              </span>
                            )}
                            {occupied && (
                              <span className="absolute left-3 top-3 bg-foreground px-2 py-1 text-eyebrow text-background">
                                Opptatt
                              </span>
                            )}
                          </div>
                        }
                        key={room.slug}
                        onSelect={() =>
                          form.setFieldValue("roomSlug", room.slug)
                        }
                        selected={selected}
                      >
                        <p className="font-heading text-lg text-foreground">
                          {room.title ?? room.slug}
                        </p>
                        {room.summary && (
                          <p className="line-clamp-2 text-sm leading-5 text-foreground/65">
                            {room.summary}
                          </p>
                        )}
                        <p className="text-xs text-foreground/50">
                          <RoomCapacity
                            seated={room.capacitySeated}
                            standing={room.capacityStanding}
                          />
                        </p>
                      </SelectableCard>
                    )
                  })}
                </div>
              ) : (
                <FieldHint>
                  Ingen rom er tilgjengelige for booking akkurat n�.
                </FieldHint>
              )}

              <div className="max-w-3xl space-y-4">
                <FieldGroup>
                  <Label>Dato *</Label>
                  {selectedRoom ? (
                    <DateScroller
                      dates={dates}
                      getDateState={date =>
                        date === startDate
                          ? "selected"
                          : dateHasAvailableRoomSlot(
                                date,
                                durationHours,
                                roomBookings,
                                openingHours,
                                selectedRoom.openingHours,
                                closedDates,
                              )
                            ? "available"
                            : "unavailable"
                      }
                      onChange={v => form.setFieldValue("startDate", v)}
                      selectedDate={startDate}
                      today={today}
                    />
                  ) : (
                    <FieldHint>Velg et rom for � se ledige dager.</FieldHint>
                  )}
                </FieldGroup>
                <BookingFormTimeSlotPicker
                  closedDates={closedDates}
                  date={startDate}
                  doorsTime={doorsTime}
                  endTime={endTime}
                  onDoorsChange={v => form.setFieldValue("doorsTime", v)}
                  onEndChange={v => form.setFieldValue("endTime", v)}
                  onStartChange={v => form.setFieldValue("startTime", v)}
                  openingHours={openingHours}
                  roomOpeningHours={selectedRoom?.openingHours ?? null}
                  startTime={startTime}
                  uid={uid}
                />
              </div>

              {isExternalBooker(bookerType) && (
                <form.Field name="flexibleDates">
                  {(field: any) => (
                    <CheckboxField
                      checked={field.state.value as boolean}
                      className="max-w-3xl"
                      label="Dato og rom er fleksibelt. Kvarteret kan foresl� et annet tidspunkt eller rom hvis dette passer bedre."
                      labelClassName="font-sans font-base text-foreground/80"
                      onChange={field.handleChange}
                    />
                  )}
                </form.Field>
              )}

              {selectedRoomTitle && startDate && (
                <Card
                  className={cn(
                    "max-w-3xl gap-2 p-4",
                    hasConflict && "border-destructive bg-destructive/10",
                  )}
                >
                  <p className="flex items-center gap-2 font-heading text-sm text-foreground">
                    <CalendarClock
                      aria-hidden
                      className="size-4 text-primary"
                    />
                    {selectedRoomTitle} – opptatt denne dagen
                  </p>
                  {selectedDateRoomBookings.length === 0 ? (
                    <p className="text-sm text-foreground/60">
                      Ingen registrerte bookinger denne dagen.
                    </p>
                  ) : (
                    <ul className="space-y-1 text-sm text-body">
                      {selectedDateRoomBookings.map(booking => (
                        <li
                          key={booking.id}
                          className="flex justify-between gap-4"
                        >
                          <span className="font-heading">
                            {formatBookingTime(booking.start)}–
                            {formatBookingTime(booking.end)}
                          </span>
                          <span className="truncate text-foreground/55">
                            {booking.title}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {hasConflict && (
                    <p className="text-sm font-heading text-destructive">
                      Valgt tidsrom overlapper en eksisterende booking. Velg et
                      annet tidspunkt.
                    </p>
                  )}
                </Card>
              )}
            </>
          )
        }}
      </form.Subscribe>
    </FormSection>
  )
}

function dateHasAvailableRoomSlot(
  date: string,
  durationHours: number,
  bookings: CresatBooking[],
  openingHours: OpeningHours | null,
  roomOpeningHours: OpeningHours | null,
  closedDates: ClosedDate[],
): boolean {
  const slotStarts = combinedSlotRangesForDate(
    date,
    durationHours,
    openingHours,
    roomOpeningHours,
    closedDates,
    30,
  )
  const hasHours =
    hasOpeningHoursRows(openingHours) || hasOpeningHoursRows(roomOpeningHours)
  const sameDaySlotStarts = slotStarts.filter(
    slotStartMin => slotStartMin < MINUTES_IN_DAY,
  )
  const candidateStarts =
    slotStarts.length > 0 || hasHours
      ? sameDaySlotStarts
      : Array.from({ length: 48 }, (_, index) => index * 30)

  return candidateStarts.some(slotStartMin => {
    const startMs =
      new Date(`${date}T00:00:00`).getTime() + slotStartMin * 60_000
    const endMs = startMs + durationHours * 60 * 60_000
    return !bookings.some(booking => overlaps(startMs, endMs, booking))
  })
}
