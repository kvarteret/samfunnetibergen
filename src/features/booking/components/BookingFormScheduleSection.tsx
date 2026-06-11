"use client"

import type { AnyFieldApi } from "@tanstack/react-form"
import { Building2, CalendarClock, Check } from "lucide-react"
import { useId } from "react"
import { Card } from "@/components/ui/card"
import { CheckboxField } from "@/components/ui/checkbox-field"
import { DateScroller } from "@/components/ui/date-scroller"
import { FieldError } from "@/components/ui/field-error"
import { FieldGroup, FieldHint } from "@/components/ui/field-group"
import { FormSection } from "@/components/ui/form-section"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import { Label } from "@/components/ui/label"
import {
  SelectableCard,
  SelectableCardGroup,
} from "@/components/ui/selectable-card"
import { Tag } from "@/components/ui/tag"
import { RoomCapacity } from "@/features/rooms"
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
import type { BookingFormValues } from "./BookingForm"
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
  startDateError?: string
  startDateId: string
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
  startDateError,
  startDateId,
}: BookingFormScheduleSectionProps) {
  const uid = useId()
  const form = useBookingForm()
  const startDateErrorId = `${startDateId}-error`

  const today = isoDate(new Date())
  const dates = buildDateSequence(today, DATE_COUNT)

  return (
    <FormSection number="02" title="Rom og tidspunkt">
      <form.Subscribe
        selector={(s: { values: BookingFormValues }) => ({
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
                <SelectableCardGroup
                  className="md:grid-cols-2 xl:grid-cols-3"
                  onValueChange={value => form.setFieldValue("roomSlug", value)}
                  value={roomSlug}
                >
                  {rooms.map(room => {
                    const selected = roomSlug === room.slug
                    const occupied = occupiedSlugs.has(room.slug)
                    return (
                      <SelectableCard
                        className="hover:border-primary"
                        disabled={occupied}
                        image={
                          <div className="relative aspect-video bg-muted">
                            <ImageWithFallback
                              alt={room.image?.alt ?? room.title ?? room.slug}
                              fallback={
                                <Building2
                                  aria-hidden
                                  className="size-8 text-foreground-muted"
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
                              <Tag
                                className="absolute left-3 top-3"
                                variant="destructive"
                              >
                                Opptatt
                              </Tag>
                            )}
                          </div>
                        }
                        key={room.slug}
                        value={room.slug}
                      >
                        <p className="font-heading text-lg text-foreground">
                          {room.title ?? room.slug}
                        </p>
                        {room.summary && (
                          <p className="line-clamp-2 leading-5 text-foreground-muted">
                            {room.summary}
                          </p>
                        )}
                        <p className="text-sm text-foreground-muted">
                          <RoomCapacity
                            seated={room.capacitySeated}
                            standing={room.capacityStanding}
                          />
                        </p>
                      </SelectableCard>
                    )
                  })}
                </SelectableCardGroup>
              ) : (
                <FieldHint>
                  Ingen rom er tilgjengelige for booking akkurat nå.
                </FieldHint>
              )}

              <div className="max-w-3xl space-y-4">
                <FieldGroup error={startDateError} errorId={startDateErrorId}>
                  <Label>Dato *</Label>
                  {selectedRoom ? (
                    <DateScroller
                      aria-describedby={
                        startDateError ? startDateErrorId : undefined
                      }
                      aria-invalid={!!startDateError}
                      dates={dates}
                      getDateAvailability={date =>
                        dateHasAvailableRoomSlot(
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
                      id={startDateId}
                      onChange={v => form.setFieldValue("startDate", v)}
                      selectedDate={startDate}
                      today={today}
                    />
                  ) : (
                    <FieldHint>Velg et rom for å se ledige dager.</FieldHint>
                  )}
                </FieldGroup>
                <div
                  className="focus-brutal"
                  id={`${startDateId}-time`}
                  tabIndex={-1}
                >
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
              </div>

              {isExternalBooker(bookerType) && (
                <form.Field name="flexibleDates">
                  {(field: AnyFieldApi) => (
                    <CheckboxField
                      checked={field.state.value as boolean}
                      className="max-w-3xl"
                      label="Dato og rom er fleksibelt. Kvarteret kan foreslå et annet tidspunkt eller rom hvis dette passer bedre."
                      labelClassName="font-sans font-base text-foreground-muted"
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
                  <p className="flex items-center gap-2 font-heading text-foreground">
                    <CalendarClock
                      aria-hidden
                      className="size-4 text-primary"
                    />
                    {selectedRoomTitle} – opptatt denne dagen
                  </p>
                  {selectedDateRoomBookings.length === 0 ? (
                    <p className=" text-foreground-muted">
                      Ingen registrerte bookinger denne dagen.
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {selectedDateRoomBookings.map(booking => (
                        <li
                          key={booking.id}
                          className="flex justify-between gap-4"
                        >
                          <span className="font-heading">
                            {formatBookingTime(booking.start)}–
                            {formatBookingTime(booking.end)}
                          </span>
                          <span className="truncate text-foreground-muted">
                            {booking.title}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {hasConflict && (
                    <FieldError id={`${startDateId}-time-conflict`}>
                      Valgt tidsrom overlapper en eksisterende booking. Velg et
                      annet tidspunkt.
                    </FieldError>
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
