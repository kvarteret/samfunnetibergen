import { MapPin, X } from "lucide-react"
import { DetailRow } from "@/components/ui/detail-row"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"

import type { ClosedDate, OpeningHours } from "@/lib/opening-hours"
import { type BookingFormState, composeCatering } from "../domain/formState"
import { computePriceSummary } from "../domain/pricing"
import type { BookingRoom } from "../types"
import { useBookingForm } from "./bookingFormContext"

function formatKr(amount: number): string {
  return `${amount.toLocaleString("nb-NO")} kr`
}

interface BookingOrderSummaryProps {
  state: BookingFormState
  rooms: BookingRoom[]
  selectedRoomIds: number[]
  openingHours: OpeningHours | null
  closedDates: ClosedDate[]
}

export function BookingFormOrderSummary({
  state,
  rooms,
  selectedRoomIds,
  openingHours,
  closedDates,
}: BookingOrderSummaryProps) {
  const form = useBookingForm()
  const catering = composeCatering(state)

  const selectedRooms = rooms.filter(r =>
    selectedRoomIds.includes(r.crescatRoomId),
  )
  const priceSummary = computePriceSummary(
    state,
    selectedRooms,
    openingHours,
    closedDates,
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
            {catering && (
              <DetailRow label="Mat og bar" layout="vertical">
                <span className="whitespace-pre-line">{catering}</span>
              </DetailRow>
            )}
          </dl>

          {priceSummary.lines.length > 0 && (
            <BookingPriceSummary summary={priceSummary} />
          )}
        </div>
      </div>
    </aside>
  )
}

function BookingPriceSummary({
  summary,
}: {
  summary: ReturnType<typeof computePriceSummary>
}) {
  return (
    <div className="space-y-1.5 border-t-2 border-border pt-3">
      <p className="font-heading text-sm uppercase tracking-widest text-foreground-muted">
        Estimert pris
      </p>
      <dl className="space-y-1 text-sm">
        {summary.lines.map(line => (
          <div className="flex justify-between gap-4" key={line.label}>
            <dt className="text-foreground-muted">{line.label}</dt>
            <dd className="shrink-0 text-foreground">
              {formatKr(line.amount)}
            </dd>
          </div>
        ))}
      </dl>
      <div className="flex justify-between gap-4 border-t border-border pt-1.5 text-sm">
        <span className="text-foreground-muted">Sum eks. mva</span>
        <span className="text-foreground">
          {formatKr(summary.subtotalExVat)}
        </span>
      </div>
      <div className="flex justify-between gap-4 text-sm">
        <span className="text-foreground-muted">Mva (25 %)</span>
        <span className="text-foreground">{formatKr(summary.vat)}</span>
      </div>
      <div className="flex justify-between gap-4 pt-1">
        <span className="font-heading text-foreground">Totalt ink. mva</span>
        <span className="font-heading text-lg text-primary">
          {formatKr(summary.totalIncVat)}
        </span>
      </div>
    </div>
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
            fallback={
              <MapPin aria-hidden className="size-4 text-foreground-muted" />
            }
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
