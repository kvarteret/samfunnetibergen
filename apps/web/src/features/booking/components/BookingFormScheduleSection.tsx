"use client"

import { Popover } from "@base-ui/react/popover"
import type { AnyFieldApi } from "@tanstack/react-form"
import {
  ArrowRight,
  Building2,
  CalendarClock,
  Check,
  Info,
  Plus,
  X,
} from "lucide-react"
import { type MouseEvent, type ReactNode, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { CheckboxField } from "@/components/ui/checkbox-field"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { FieldGroup } from "@/components/ui/field-group"
import { FormSection } from "@/components/ui/form-section"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import { Label } from "@/components/ui/label"
import { RoomCapacity } from "@/features/rooms"
import { Link } from "@/i18n/navigation"
import {
  type ClosedDate,
  isoDate,
  type OpeningHours,
  type VacationMode,
} from "@/lib/opening-hours"
import { cn } from "@/lib/utils"
import type { BookerType } from "../domain/formState"
import { isExternalBooker } from "../domain/formState"
import type { BookingRoom } from "../types"
import type { BookingFormValues } from "./BookingForm"
import { useBookingForm } from "./bookingFormContext"

interface BookingFormScheduleSectionProps {
  rooms: BookingRoom[]
  roomOccupancy: Map<number, string[]>
  occupiedRanges: { startMin: number; endMin: number }[]
  openingHours: OpeningHours | null
  closedDates: ClosedDate[]
  vacationMode?: VacationMode | null
  startDateError?: string
  startDateId: string
}

export function BookingFormScheduleSection({
  rooms,
  roomOccupancy,
  occupiedRanges,
  openingHours,
  closedDates,
  vacationMode,
  startDateError,
  startDateId,
}: BookingFormScheduleSectionProps) {
  const form = useBookingForm()
  const startDateErrorId = `${startDateId}-error`

  const today = isoDate(new Date())

  return (
    <FormSection id="booking-schedule" number="02" title="Rom og tidspunkt">
      <form.Subscribe
        selector={(s: { values: BookingFormValues }) => ({
          selectedRoomIds: s.values.selectedRoomIds as number[],
          startDate: s.values.startDate,
          endDate: s.values.endDate,
          startTime: s.values.startTime,
          endTime: s.values.endTime,
          bookerType: s.values.bookerType,
        })}
      >
        {({
          selectedRoomIds,
          startDate,
          endDate,
          startTime,
          endTime,
          bookerType,
        }: {
          selectedRoomIds: number[]
          startDate: string
          endDate: string
          startTime: string
          endTime: string
          bookerType: BookerType
        }) => {
          const selectedRoomIdSet = new Set(selectedRoomIds)
          const firstRoom = rooms.find(room =>
            selectedRoomIdSet.has(room.crescatRoomId),
          )
          const toggleRoom = (roomId: number) => {
            const next = selectedRoomIds.includes(roomId)
              ? selectedRoomIds.filter(id => id !== roomId)
              : [...selectedRoomIds, roomId]
            form.setFieldValue("selectedRoomIds", next)
          }
          const selectedConflictRooms = rooms.filter(
            room =>
              selectedRoomIdSet.has(room.crescatRoomId) &&
              roomOccupancy.has(room.crescatRoomId),
          )

          return (
            <>
              <FieldGroup error={startDateError} errorId={startDateErrorId}>
                <Label>Dato og tidspunkt *</Label>
                <DateTimePicker
                  closedDates={closedDates}
                  endDate={endDate}
                  endTime={endTime}
                  occupiedRanges={occupiedRanges}
                  onEndChange={v => form.setFieldValue("endTime", v)}
                  onEndDateChange={v => {
                    form.setFieldValue("endDate", v)
                    form.setFieldValue("doorsTimes", [])
                    form.setFieldValue("estimatedEndTimes", [])
                  }}
                  onStartChange={v => form.setFieldValue("startTime", v)}
                  onStartDateChange={v => {
                    form.setFieldValue("startDate", v)
                    form.setFieldValue("doorsTimes", [])
                    form.setFieldValue("estimatedEndTimes", [])
                  }}
                  openingHours={openingHours}
                  roomOpeningHours={firstRoom?.openingHours ?? null}
                  startDate={startDate}
                  startTime={startTime}
                  timingWarning={
                    selectedConflictRooms.length > 0 ? (
                      <Alert id={`${startDateId}-time`} variant="destructive">
                        <CalendarClock aria-hidden />
                        <AlertTitle>
                          {selectedConflictRooms
                            .map(room => room.title ?? room.crescatRoomId)
                            .join(", ")}{" "}
                          er opptatt i valgt tidsrom
                        </AlertTitle>
                        <AlertDescription className="gap-3">
                          <p>
                            Endre tidspunktet eller fjern rommet fra bookingen.
                          </p>
                          {selectedConflictRooms.map(room => (
                            <Button
                              key={room.crescatRoomId}
                              onClick={() => toggleRoom(room.crescatRoomId)}
                              size="sm"
                              type="button"
                              variant="neutral"
                            >
                              <X aria-hidden />
                              Fjern {room.title ?? room.crescatRoomId}
                            </Button>
                          ))}
                        </AlertDescription>
                      </Alert>
                    ) : undefined
                  }
                  today={today}
                  vacationMode={vacationMode}
                />
                <p className="text-sm text-foreground-muted">
                  Husk å beregne tid til opprigg og nedrigg innenfor bookingens
                  start- og sluttid.
                </p>
              </FieldGroup>

              {startDate && startTime && endTime ? (
                rooms.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {rooms.map(room => {
                      const selected = selectedRoomIdSet.has(room.crescatRoomId)
                      const occupied = roomOccupancy.has(room.crescatRoomId)
                      const conflicts =
                        roomOccupancy.get(room.crescatRoomId) ?? []
                      const roomName = room.title ?? String(room.crescatRoomId)
                      const isCrescatOnly = room.source === "crescat"

                      return (
                        <div
                          className={cn(
                            "relative flex flex-col overflow-hidden border-2 transition-colors",
                            occupied
                              ? "border-border bg-card cursor-default"
                              : "cursor-pointer",
                            !occupied && selected
                              ? "border-state bg-state/5"
                              : !occupied && "border-border bg-card",
                          )}
                          key={room.crescatRoomId}
                          onClick={() =>
                            !occupied && toggleRoom(room.crescatRoomId)
                          }
                        >
                          {!isCrescatOnly && (
                            <div className="relative aspect-video bg-muted">
                              <ImageWithFallback
                                alt={room.image?.alt ?? roomName}
                                className={cn(occupied && "grayscale")}
                                fallback={
                                  <Building2
                                    aria-hidden
                                    className="size-8 text-foreground-muted"
                                  />
                                }
                                sizes="(min-width: 1280px) 25vw, (min-width: 768px) 40vw, 100vw"
                                src={room.image?.assetUrl}
                              />
                              {occupied && (
                                <div className="absolute inset-0 flex flex-col bg-black/55">
                                  <div className="flex items-center gap-1.5 bg-destructive px-3 py-1.5 text-destructive-foreground">
                                    <CalendarClock
                                      aria-hidden
                                      className="size-4 shrink-0"
                                    />
                                    <span className="font-heading text-sm uppercase tracking-widest">
                                      Opptatt
                                    </span>
                                  </div>
                                  <div className="mt-auto p-3">
                                    <RoomConflictList
                                      conflicts={conflicts}
                                      tone="onImage"
                                    />
                                  </div>
                                </div>
                              )}
                              {!occupied && (
                                <AddRoomButton
                                  className="absolute right-3 top-3"
                                  onClick={() => toggleRoom(room.crescatRoomId)}
                                  selected={selected}
                                />
                              )}
                            </div>
                          )}
                          <div className="flex flex-1 flex-col gap-2 p-4">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-heading text-lg text-foreground">
                                {roomName}
                              </p>
                              {isCrescatOnly && !occupied && (
                                <AddRoomButton
                                  onClick={() => toggleRoom(room.crescatRoomId)}
                                  selected={selected}
                                />
                              )}
                              {isCrescatOnly && occupied && (
                                <div className="flex items-center gap-1 text-destructive">
                                  <CalendarClock
                                    aria-hidden
                                    className="size-3.5 shrink-0"
                                  />
                                  <span className="font-heading text-xs uppercase tracking-widest">
                                    Opptatt
                                  </span>
                                </div>
                              )}
                            </div>
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
                            {/* Occupied conflicts now render over the image; the
                                crescat-only card (no image) still needs them
                                inline. */}
                            {occupied && isCrescatOnly && (
                              <RoomConflictList conflicts={conflicts} />
                            )}
                            {room.slug && (
                              <div
                                className="mt-auto pt-1"
                                onClick={e => e.stopPropagation()}
                              >
                                <RoomInfoTrigger room={room} />
                              </div>
                            )}
                          </div>
                        </div>
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
            </>
          )
        }}
      </form.Subscribe>
    </FormSection>
  )
}

const CONFLICT_PREVIEW_COUNT = 3

function RoomConflictList({
  conflicts,
  tone = "inline",
}: {
  conflicts: string[]
  tone?: "inline" | "onImage"
}) {
  const [expanded, setExpanded] = useState(false)
  const visibleConflicts = expanded
    ? conflicts
    : conflicts.slice(0, CONFLICT_PREVIEW_COUNT)
  const hiddenCount = conflicts.length - visibleConflicts.length

  return (
    <ul
      className={cn(
        "space-y-0.5 text-sm",
        tone === "onImage" ? "text-white" : "text-destructive",
      )}
    >
      {visibleConflicts.map(conflict => (
        <li key={conflict}>{conflict}</li>
      ))}
      {hiddenCount > 0 && (
        <li>
          <button
            className="font-heading underline underline-offset-4"
            onClick={e => {
              e.preventDefault()
              e.stopPropagation()
              setExpanded(true)
            }}
            type="button"
          >
            Vis {hiddenCount} til
          </button>
        </li>
      )}
    </ul>
  )
}

const TECH_SPECS: {
  label: string
  hasKey: "hasSound" | "hasLighting" | "hasAV"
  detailsKey: "soundDetails" | "lightingDetails" | "avDetails"
}[] = [
  { label: "Lyd", hasKey: "hasSound", detailsKey: "soundDetails" },
  { label: "Lys", hasKey: "hasLighting", detailsKey: "lightingDetails" },
  { label: "A/V", hasKey: "hasAV", detailsKey: "avDetails" },
]

// Adds or removes a room from the booking. The whole card also toggles the
// room now, so this button stops propagation to avoid double-toggling.
function AddRoomButton({
  selected,
  onClick,
  className,
}: {
  selected: boolean
  onClick: () => void
  className?: string
}) {
  const handleClick = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onClick()
  }

  if (selected) {
    return (
      <button
        aria-label="Fjern rom fra bookingen"
        className={cn(
          "flex items-center gap-1.5 border-2 border-state bg-state px-2.5 py-1 font-heading text-xs uppercase tracking-widest text-state-foreground transition-colors hover:opacity-90 focus-brutal",
          className,
        )}
        onClick={handleClick}
        type="button"
      >
        <Check aria-hidden className="size-3.5" />
        Lagt til
      </button>
    )
  }

  return (
    <button
      aria-label="Legg til rom i bookingen"
      className={cn(
        "flex size-8 items-center justify-center border-2 border-border bg-card text-foreground transition-colors hover:border-state hover:bg-state hover:text-state-foreground focus-brutal",
        className,
      )}
      onClick={handleClick}
      type="button"
    >
      <Plus aria-hidden className="size-4" />
    </button>
  )
}

// Info trigger for a room's full facility list, with a link into the room's
// own page. Opens on hover (0ms delay, so it's obvious it's interactive) or
// on tap, since it's a real button rather than relying on hover-only
// behavior that doesn't work on touch devices. The caller stops propagation
// so opening it doesn't also toggle the room.
function RoomInfoTrigger({
  room,
  className,
}: {
  room: BookingRoom
  className?: string
}) {
  const hasCapacity =
    room.capacityStanding != null || room.capacitySeated != null

  return (
    <Popover.Root>
      <Popover.Trigger
        aria-label={`Mer info om ${room.title}`}
        className={cn(
          "flex cursor-pointer items-center gap-1.5 border-2 border-border bg-card/90 px-2.5 py-1 font-heading text-xs tracking-widest text-foreground-muted backdrop-blur-sm transition-colors hover:border-primary hover:text-foreground focus-brutal",
          className,
        )}
        closeDelay={100}
        delay={0}
        openOnHover
      >
        <Info aria-hidden className="size-3.5" />
        Mer info
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={12}>
          <Popover.Popup className="z-[100] w-72 space-y-3 panel shadow-shadow">
            <div className="space-y-1">
              <p className="font-heading text-lg text-foreground">
                {room.title}
              </p>
              {room.summary && (
                <p className="text-sm text-foreground-muted">{room.summary}</p>
              )}
            </div>

            <dl className="space-y-1.5 text-sm">
              {hasCapacity && (
                <PreviewRow label="Kapasitet">
                  <RoomCapacity
                    seated={room.capacitySeated}
                    standing={room.capacityStanding}
                  />
                </PreviewRow>
              )}
              {room.floor != null && (
                <PreviewRow label="Etasje">{room.floor}. etasje</PreviewRow>
              )}
              {room.suitedPurposes.length > 0 && (
                <PreviewRow label="Passer til">
                  {room.suitedPurposes.join(", ")}
                </PreviewRow>
              )}
              {room.bar != null && (
                <PreviewRow label="Bar">{room.bar || "Nei"}</PreviewRow>
              )}
              {TECH_SPECS.map(spec => (
                <PreviewRow key={spec.label} label={spec.label}>
                  <TechSpecValue
                    details={room[spec.detailsKey]}
                    value={room[spec.hasKey]}
                  />
                </PreviewRow>
              ))}
            </dl>

            <Link
              className="inline-flex items-center gap-2 font-heading text-foreground underline underline-offset-4 hover:text-primary"
              href={`/rom/${room.slug}`}
            >
              Se rommet
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

function PreviewRow({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex gap-2">
      <dt className="w-20 shrink-0 font-heading text-xs uppercase tracking-wide text-foreground-muted">
        {label}
      </dt>
      <dd className="text-foreground">{children}</dd>
    </div>
  )
}

function TechSpecValue({
  value,
  details,
}: {
  value: boolean
  details: string | null
}) {
  return (
    <span
      className={cn(
        "inline-flex items-start gap-1.5",
        !value && "text-foreground-muted",
      )}
    >
      {value ? (
        <Check
          aria-hidden
          className="mt-0.5 size-3.5 shrink-0 text-green-700 dark:text-green-400"
        />
      ) : (
        <X aria-hidden className="mt-0.5 size-3.5 shrink-0" />
      )}
      {value ? details || "Ja" : "Nei"}
    </span>
  )
}
