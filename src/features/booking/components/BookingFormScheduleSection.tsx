"use client"

import { PreviewCard } from "@base-ui/react/preview-card"
import type { AnyFieldApi } from "@tanstack/react-form"
import { ArrowRight, Building2, CalendarClock, Check, X } from "lucide-react"
import {
  Fragment,
  type ReactElement,
  type ReactNode,
  useId,
  useState,
} from "react"
import { Card } from "@/components/ui/card"
import { CheckboxField } from "@/components/ui/checkbox-field"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { FieldGroup } from "@/components/ui/field-group"
import { FormSection } from "@/components/ui/form-section"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import { Label } from "@/components/ui/label"
import { Tag } from "@/components/ui/tag"
import { RoomCapacity } from "@/features/rooms"
import { Link } from "@/i18n/navigation"
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
  roomOccupancy: Map<number, string[]>
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
                      const conflicts =
                        roomOccupancy.get(room.crescatRoomId) ?? []
                      const roomName = room.title ?? String(room.crescatRoomId)
                      const isCrescatOnly = room.source === "crescat"

                      const toggleRoom = (roomId: number) => {
                        const next = selectedRoomIds.includes(roomId)
                          ? selectedRoomIds.filter(id => id !== roomId)
                          : [...selectedRoomIds, roomId]
                        form.setFieldValue("selectedRoomIds", next)
                      }

                      const roomCard = (
                        <label
                          className={cn(
                            "group flex cursor-pointer flex-col overflow-hidden border-2 transition-colors",
                            selected
                              ? "border-primary bg-primary/5"
                              : "border-border bg-card hover:border-primary",
                            occupied && "cursor-not-allowed",
                          )}
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
                                  Opptatt
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
                            {occupied && (
                              <RoomConflictList conflicts={conflicts} />
                            )}
                          </div>
                        </label>
                      )

                      return room.slug ? (
                        <RoomPreviewCard key={room.crescatRoomId} room={room}>
                          {roomCard}
                        </RoomPreviewCard>
                      ) : (
                        <Fragment key={room.crescatRoomId}>{roomCard}</Fragment>
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

const CONFLICT_PREVIEW_COUNT = 3

function RoomConflictList({ conflicts }: { conflicts: string[] }) {
  const [expanded, setExpanded] = useState(false)
  const visibleConflicts = expanded
    ? conflicts
    : conflicts.slice(0, CONFLICT_PREVIEW_COUNT)
  const hiddenCount = conflicts.length - visibleConflicts.length

  return (
    <ul className="space-y-0.5 text-sm text-destructive">
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

// Hover/focus preview of a room's full facility list, with a link into the
// room's own page — the room cards here are selection checkboxes, not links,
// so this is the only way to see full room details without losing
// booking-form progress. Uses a dense label/value grid (not the spacious
// detail-page layout) so a complete facility list still skims in one glance.
function RoomPreviewCard({
  room,
  children,
}: {
  room: BookingRoom
  children: ReactElement
}) {
  const hasCapacity =
    room.capacityStanding != null || room.capacitySeated != null

  return (
    <PreviewCard.Root>
      <PreviewCard.Trigger render={children} />
      <PreviewCard.Portal>
        <PreviewCard.Positioner sideOffset={12}>
          <PreviewCard.Popup className="z-50 w-72 space-y-3 panel shadow-shadow">
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
          </PreviewCard.Popup>
        </PreviewCard.Positioner>
      </PreviewCard.Portal>
    </PreviewCard.Root>
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
