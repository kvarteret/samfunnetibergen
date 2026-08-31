import { MapPin, X } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { DetailRow } from "@/components/ui/detail-row"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"

import type {
  ClosedDate,
  OpeningHours,
  VacationMode,
} from "@/lib/opening-hours"
import { type BookingFormState, composeCatering } from "../domain/formState"
import { computePriceSummary } from "../domain/pricing"
import type { BookingRoom } from "../types"
import { useBookingForm } from "./bookingFormContext"

function formatKr(amount: number, locale: string): string {
  return `${amount.toLocaleString(locale === "en" ? "en-GB" : "nb-NO")} kr`
}

interface BookingOrderSummaryProps {
  state: BookingFormState
  rooms: BookingRoom[]
  selectedRoomIds: number[]
  openingHours: OpeningHours | null
  closedDates: ClosedDate[]
  vacationMode?: VacationMode | null
}

export function BookingFormOrderSummary({
  state,
  rooms,
  selectedRoomIds,
  openingHours,
  closedDates,
  vacationMode,
}: BookingOrderSummaryProps) {
  const form = useBookingForm()
  const locale = useLocale()
  const t = useTranslations("RoomBooking")
  const catering = composeCatering(state)

  const selectedRooms = rooms.filter(r =>
    selectedRoomIds.includes(r.crescatRoomId),
  )
  const priceSummary = computePriceSummary(
    state,
    selectedRooms,
    openingHours,
    closedDates,
    vacationMode,
    {
      barHouse: t("summary.barHouse"),
      hours: t("summary.hours"),
      lightingTechnician: t("summary.lightingTechnician"),
      riggingSetup: t("summary.riggingSetup"),
      riggingTeardown: t("summary.riggingTeardown"),
      room: t("summary.room"),
      soundTechnician: t("summary.soundTechnician"),
    },
  )

  const removeRoom = (roomId: number) => {
    const next = selectedRoomIds.filter(id => id !== roomId)
    form.setFieldValue("selectedRoomIds", next)
  }

  return (
    <aside>
      <div className="panel p-0">
        <p className="border-b-2 border-border bg-muted/50 px-5 py-3 font-heading text-sm uppercase tracking-widest text-foreground">
          {t("summary.booker", {
            booker:
              state.bookerType === "ekstern"
                ? t("bookerLabels.private")
                : state.bookerType === "studentorg"
                  ? t("bookerLabels.studentOrganization")
                  : t("bookerLabels.internal"),
          })}
        </p>
        {selectedRooms.length > 0 ? (
          <div>
            {selectedRooms.map((room, i) => (
              <SelectedRoomCard
                compact={i > 0}
                key={room.crescatRoomId}
                onRemove={() => removeRoom(room.crescatRoomId)}
                room={room}
                t={t}
              />
            ))}
          </div>
        ) : (
          <div className="flex aspect-video items-center justify-center bg-muted text-foreground-muted">
            <MapPin aria-hidden className="mr-2 size-4" />
            {t("summary.selectRoom")}
          </div>
        )}

        <div className="space-y-3 p-5">
          <p className="font-heading uppercase tracking-widest">
            {t("summary.overview")}
          </p>

          <dl className="space-y-2.5">
            {catering && (
              <DetailRow label={t("summary.catering")} layout="vertical">
                <span className="whitespace-pre-line">{catering}</span>
              </DetailRow>
            )}
          </dl>

          {priceSummary.lines.length > 0 && (
            <BookingPriceSummary locale={locale} summary={priceSummary} t={t} />
          )}
        </div>
      </div>
    </aside>
  )
}

function BookingPriceSummary({
  summary,
  locale,
  t,
}: {
  summary: ReturnType<typeof computePriceSummary>
  locale: string
  t: ReturnType<typeof useTranslations<"RoomBooking">>
}) {
  return (
    <div className="space-y-1.5 border-t-2 border-border pt-3">
      <p className="font-heading text-sm uppercase tracking-widest text-foreground-muted">
        {t("summary.estimatedPrice")}
      </p>
      <dl className="space-y-1 text-sm">
        {summary.lines.map(line => (
          <div className="flex justify-between gap-4" key={line.label}>
            <dt className="text-foreground-muted">{line.label}</dt>
            <dd className="shrink-0 text-foreground">
              {formatKr(line.amount, locale)}
            </dd>
          </div>
        ))}
      </dl>
      <div className="flex justify-between gap-4 border-t border-border pt-1.5 text-sm">
        <span className="text-foreground-muted">{t("summary.subtotal")}</span>
        <span className="text-foreground">
          {formatKr(summary.subtotalExVat, locale)}
        </span>
      </div>
      <div className="flex justify-between gap-4 text-sm">
        <span className="text-foreground-muted">{t("summary.vat")}</span>
        <span className="text-foreground">{formatKr(summary.vat, locale)}</span>
      </div>
      <div className="flex justify-between gap-4 pt-1">
        <span className="font-heading text-foreground">
          {t("summary.total")}
        </span>
        <span className="font-heading text-lg text-primary">
          {formatKr(summary.totalIncVat, locale)}
        </span>
      </div>
    </div>
  )
}

function SelectedRoomCard({
  room,
  compact,
  onRemove,
  t,
}: {
  room: BookingRoom
  compact?: boolean
  onRemove: () => void
  t: ReturnType<typeof useTranslations<"RoomBooking">>
}) {
  const isCrescatOnly = room.source === "crescat"
  const roomName = room.title ?? String(room.crescatRoomId)
  const capacity = [
    room.capacityStanding &&
      `${room.capacityStanding} ${t("summary.standing")}`,
    room.capacitySeated && `${room.capacitySeated} ${t("summary.seated")}`,
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
          aria-label={t("summary.removeRoom", { room: roomName })}
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
              {t("summary.room")}
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
            aria-label={t("summary.removeRoom", { room: roomName })}
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
