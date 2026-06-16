"use client"

import type { AnyFieldApi } from "@tanstack/react-form"
import { Building2, CalendarClock, Check } from "lucide-react"
import { useId } from "react"
import { Card } from "@/components/ui/card"
import { CheckboxField } from "@/components/ui/checkbox-field"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { FieldGroup } from "@/components/ui/field-group"
import { FormSection } from "@/components/ui/form-section"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import { Label } from "@/components/ui/label"
import { Tag } from "@/components/ui/tag"
import { RoomCapacity } from "@/features/rooms"
import {
  type ClosedDate,
  isoDate,
  type OpeningHours,
} from "@/lib/opening-hours"
import { cn } from "@/lib/utils"
import type { BookerType } from "../domain/formState"
import { isExternalBooker } from "../domain/formState"
import type { BookingRoom } from "../types"
import type { BookingFormValues } from "./BookingForm"
import { useBookingForm } from "./bookingFormContext"

interface BookingFormScheduleSectionProps {
  rooms: BookingRoom[]
  roomOccupancy: Map<number, string>
  selectedRoomIds: number[]
  hasConflict: boolean
  openingHours: OpeningHours | null
  closedDates: ClosedDate[]
  startDateError?: string
  startDateId: string
}

export function BookingFormScheduleSection({
  rooms,
  roomOccupancy,
  selectedRoomIds,
  hasConflict,
  openingHours,
  closedDates,
  startDateError,
  startDateId,
}: BookingFormScheduleSectionProps) {
  const uid = useId()
  const form = useBookingForm()
  const startDateErrorId = `${startDateId}-error`

  const today = isoDate(new Date())
  const firstRoom = rooms.find(r => selectedRoomIds.includes(r.crescatRoomId))

  return (
    <FormSection number="02" title="Rom og tidspunkt">
      <form.Subscribe
        selector={(s: { values: BookingFormValues }) => ({
          selectedRoomIds: s.values.selectedRoomIds as number[],
          startDate: s.values.startDate,
          endDate: s.values.endDate,
          startTime: s.values.startTime,
          endTime: s.values.endTime,
          doorsTime: s.values.doorsTime,
          bookerType: s.values.bookerType,
        })}
      >
        {({
          selectedRoomIds,
          startDate,
          endDate,
          startTime,
          endTime,
          doorsTime,
          bookerType,
        }: {
          selectedRoomIds: number[]
          startDate: string
          endDate: string
          startTime: string
          endTime: string
          doorsTime: string
          bookerType: BookerType
        }) => {
          return (
            <>
              <FieldGroup error={startDateError} errorId={startDateErrorId}>
                <Label>Dato og tidspunkt *</Label>
                <DateTimePicker
                  closedDates={closedDates}
                  doorsTime={doorsTime}
                  endDate={endDate}
                  endTime={endTime}
                  onDoorsChange={v => form.setFieldValue("doorsTime", v)}
                  onEndChange={v => form.setFieldValue("endTime", v)}
                  onEndDateChange={v => form.setFieldValue("endDate", v)}
                  onStartChange={v => form.setFieldValue("startTime", v)}
                  onStartDateChange={v => form.setFieldValue("startDate", v)}
                  openingHours={openingHours}
                  roomOpeningHours={firstRoom?.openingHours ?? null}
                  startDate={startDate}
                  startTime={startTime}
                  today={today}
                  uid={uid}
                />
              </FieldGroup>

              {startDate && startTime && endTime ? (
                rooms.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {rooms.map(room => {
                      const selected = selectedRoomIds.includes(
                        room.crescatRoomId,
                      )
                      const occupied = roomOccupancy.has(room.crescatRoomId)
                      const conflictRange = roomOccupancy.get(
                        room.crescatRoomId,
                      )
                      const roomName = room.title ?? String(room.crescatRoomId)
                      const isCrescatOnly = room.source === "crescat"

                      const toggleRoom = (roomId: number) => {
                        const next = selectedRoomIds.includes(roomId)
                          ? selectedRoomIds.filter(id => id !== roomId)
                          : [...selectedRoomIds, roomId]
                        form.setFieldValue("selectedRoomIds", next)
                      }

                      return (
                        <label
                          className={cn(
                            "group flex cursor-pointer flex-col overflow-hidden border-2 transition-colors",
                            selected
                              ? "border-primary bg-primary/5"
                              : "border-border bg-card hover:border-primary",
                            occupied && "cursor-not-allowed opacity-60",
                          )}
                          key={room.crescatRoomId}
                        >
                          <input
                            checked={selected}
                            className="sr-only"
                            disabled={occupied}
                            onChange={() => toggleRoom(room.crescatRoomId)}
                            type="checkbox"
                          />
                          {!isCrescatOnly && (
                            <div className="relative aspect-video bg-muted">
                              <ImageWithFallback
                                alt={room.image?.alt ?? roomName}
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
                                  {conflictRange
                                    ? `Opptatt mellom ${conflictRange}`
                                    : "Opptatt"}
                                </Tag>
                              )}
                            </div>
                          )}
                          <div className="flex flex-1 flex-col gap-2 p-4">
                            <p className="font-heading text-lg text-foreground">
                              {roomName}
                            </p>
                            {!isCrescatOnly &&
                              (room.capacityStanding ||
                                room.capacitySeated) && (
                                <p className="text-sm text-foreground-muted">
                                  <RoomCapacity
                                    seated={room.capacitySeated}
                                    standing={room.capacityStanding}
                                  />
                                </p>
                              )}
                          </div>
                        </label>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-foreground-muted">
                    Ingen rom er tilgjengelige for booking akkurat nå.
                  </p>
                )
              ) : (
                <p className="text-sm text-foreground-muted">
                  Velg dato og tid for å se ledige rom.
                </p>
              )}

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

              {hasConflict && (
                <Card className="max-w-3xl gap-2 p-4 border-destructive bg-destructive/10">
                  <p
                    className="flex items-center gap-2 border-l-4 border-destructive pl-3 font-heading text-destructive"
                    id={`${startDateId}-time-conflict`}
                    role="alert"
                  >
                    <CalendarClock aria-hidden className="size-4 shrink-0" />
                    Valgt tidsrom overlapper en eksisterende booking. Velg et
                    annet tidspunkt.
                  </p>
                </Card>
              )}
            </>
          )
        }}
      </form.Subscribe>
    </FormSection>
  )
}
