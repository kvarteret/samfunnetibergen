import { CalendarClock, DoorOpen, MapPin, Users } from "lucide-react"
import { DetailRow } from "@/components/ui/detail-row"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"

import {
  type BookerType,
  type BookingFormState,
  composeCatering,
  composeTechEquipment,
} from "../domain/formState"
import type { BookingRoom } from "../types"

const BOOKER_LABELS: Record<BookerType, string> = {
  ekstern: "Ekstern / privat",
  studentorg: "Studentorganisasjon",
  intern: "Intern",
}

interface BookingOrderSummaryProps {
  state: BookingFormState
  selectedRoom?: BookingRoom
}

export function BookingFormOrderSummary({
  state,
  selectedRoom,
}: BookingOrderSummaryProps) {
  const tech = composeTechEquipment(state)
  const catering = composeCatering(state)
  const time = state.startDate
    ? `${state.startDate} · ${state.startTime}–${state.endTime}`
    : "Ikke valgt"

  return (
    <aside>
      <div className="panel p-0">
        <SelectedRoomCard room={selectedRoom} />

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

function SelectedRoomCard({ room }: { room?: BookingRoom }) {
  if (!room) {
    return (
      <div className="flex aspect-video items-center justify-center bg-muted text-foreground-muted">
        <MapPin aria-hidden className="mr-2 size-4" />
        Velg et rom
      </div>
    )
  }

  const isCrescatOnly = room.source === "crescat"
  const roomName = room.title ?? String(room.crescatRoomId)

  return (
    <div>
      {!isCrescatOnly && (
        <ImageWithFallback
          alt={room.image?.alt ?? roomName}
          fallback={
            <span className="flex items-center gap-2 text-foreground-muted">
              <MapPin aria-hidden className="size-4" />
              Velg et rom
            </span>
          }
          sizes="(min-width: 1024px) 360px, 100vw"
          src={room.image?.assetUrl}
        />
      )}
      <div className="border-b-2 border-border p-5">
        <p className="font-heading text-xl leading-tight text-foreground">
          {roomName}
        </p>
        {!isCrescatOnly &&
          (room.capacityStanding || room.capacitySeated) && (
            <p className="mt-1 text-sm text-foreground-muted">
              {[
                room.capacityStanding && `${room.capacityStanding} stående`,
                room.capacitySeated && `${room.capacitySeated} sittende`,
              ]
                .filter(Boolean)
                .join(" / ")}
            </p>
          )}
      </div>
    </div>
  )
}
