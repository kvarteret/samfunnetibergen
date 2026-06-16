import { CalendarClock, DoorOpen, MapPin, Users, X } from "lucide-react"
import { DetailRow } from "@/components/ui/detail-row"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"

import {
  type BookerType,
  type BookingFormState,
  composeCatering,
  composeTechEquipment,
} from "../domain/formState"
import type { BookingRoom } from "../types"
import { useBookingForm } from "./bookingFormContext"

const BOOKER_LABELS: Record<BookerType, string> = {
  ekstern: "Ekstern / privat",
  studentorg: "Studentorganisasjon",
  intern: "Intern",
}

interface BookingOrderSummaryProps {
  state: BookingFormState
  rooms: BookingRoom[]
  selectedRoomIds: number[]
}

export function BookingFormOrderSummary({
  state,
  rooms,
  selectedRoomIds,
}: BookingOrderSummaryProps) {
  const form = useBookingForm()
  const tech = composeTechEquipment(state)
  const catering = composeCatering(state)
  const time = state.startDate
    ? `${state.startDate} · ${state.startTime}–${state.endTime}`
    : "Ikke valgt"

  const selectedRooms = rooms.filter(r =>
    selectedRoomIds.includes(r.crescatRoomId),
  )

  const removeRoom = (roomId: number) => {
    const next = selectedRoomIds.filter(id => id !== roomId)
    form.setFieldValue("selectedRoomIds", next)
  }

  return (
    <aside>
      <div className="panel p-0">
        {selectedRooms.length > 0 ? (
          <div>
            {selectedRooms.map((room, i) => (
              <SelectedRoomCard
                compact={i > 0}
                key={room.crescatRoomId}
                onRemove={() => removeRoom(room.crescatRoomId)}
                room={room}
              />
            ))}
          </div>
        ) : (
          <div className="flex aspect-video items-center justify-center bg-muted text-foreground-muted">
            <MapPin aria-hidden className="mr-2 size-4" />
            Velg rom
          </div>
        )}

        <div className="space-y-3 p-5">
          <p className="font-heading uppercase tracking-widest">
            Bestillingsoversikt
          </p>

          <dl className="space-y-2.5">
            <DetailRow icon={Users} label="Booker" layout="vertical">
              {BOOKER_LABELS[state.bookerType]}
              {state.bookerType === "studentorg" && state.studentOrgName
                ? ` · ${state.studentOrgName}`
                : ""}
            </DetailRow>
            <DetailRow icon={CalendarClock} label="Tidspunkt" layout="vertical">
              {time}
            </DetailRow>
            {state.doorsTime && (
              <DetailRow icon={DoorOpen} label="Dørene åpner" layout="vertical">
                {state.doorsTime}
              </DetailRow>
            )}
            {state.eventName.trim() && (
              <DetailRow label="Arrangement" layout="vertical">
                {state.eventName}
              </DetailRow>
            )}
            {state.audienceCount.trim() && (
              <DetailRow label="Publikum" layout="vertical">
                {state.audienceCount} personer
              </DetailRow>
            )}
            <DetailRow label="Teknisk" layout="vertical">
              {tech}
            </DetailRow>
            {catering && (
              <DetailRow label="Mat og bar" layout="vertical">
                <span className="whitespace-pre-line">{catering}</span>
              </DetailRow>
            )}
            <DetailRow label="Billett" layout="vertical">
              {state.freeOrPaid === "Betalt" && state.ticketTypes.trim()
                ? `Betalt · ${state.ticketTypes}`
                : state.freeOrPaid}
            </DetailRow>
          </dl>
        </div>
      </div>
    </aside>
  )
}

function SelectedRoomCard({
  room,
  compact,
  onRemove,
}: {
  room: BookingRoom
  compact?: boolean
  onRemove: () => void
}) {
  const isCrescatOnly = room.source === "crescat"
  const roomName = room.title ?? String(room.crescatRoomId)
  const capacity = [
    room.capacityStanding && `${room.capacityStanding} stående`,
    room.capacitySeated && `${room.capacitySeated} sittende`,
  ]
    .filter(Boolean)
    .join(" / ")

  if (compact && !isCrescatOnly) {
    return (
      <div className="flex gap-3 border-b-2 border-border p-5">
        <div className="min-w-0 flex-1">
          <p className="font-heading text-lg leading-tight text-foreground">
            {roomName}
          </p>
          {capacity && (
            <p className="mt-1 text-sm text-foreground-muted">{capacity}</p>
          )}
        </div>
        <div className="w-20 shrink-0 overflow-hidden">
          <ImageWithFallback
            alt={room.image?.alt ?? roomName}
            fallback={<MapPin aria-hidden className="size-4 text-foreground-muted" />}
            sizes="80px"
            src={room.image?.assetUrl}
          />
        </div>
        <button
          aria-label={`Fjern ${roomName}`}
          className="self-start p-1 -mr-1 text-foreground-muted hover:text-destructive focus-brutal"
          onClick={e => {
            e.preventDefault()
            onRemove()
          }}
          type="button"
        >
          <X aria-hidden className="size-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      {!isCrescatOnly && (
        <ImageWithFallback
          alt={room.image?.alt ?? roomName}
          fallback={
            <span className="flex items-center gap-2 text-foreground-muted">
              <MapPin aria-hidden className="size-4" />
              Rom
            </span>
          }
          sizes="(min-width: 1024px) 360px, 100vw"
          src={room.image?.assetUrl}
        />
      )}
      <div className="border-b-2 border-border p-5">
        <div className="flex items-start justify-between gap-2">
          <p className="font-heading text-xl leading-tight text-foreground">
            {roomName}
          </p>
          <button
            aria-label={`Fjern ${roomName}`}
            className="shrink-0 p-1 -mr-1 -mt-1 text-foreground-muted hover:text-destructive focus-brutal"
            onClick={e => {
              e.preventDefault()
              onRemove()
            }}
            type="button"
          >
            <X aria-hidden className="size-4" />
          </button>
        </div>
        {!isCrescatOnly && capacity && (
            <p className="mt-1 text-sm text-foreground-muted">{capacity}</p>
          )}
      </div>
    </div>
  )
}
