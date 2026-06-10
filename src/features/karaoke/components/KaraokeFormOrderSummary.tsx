"use client"

import { Card } from "@/components/ui/card"
import { DetailRow } from "@/components/ui/detail-row"
import {
  formatKaraokeDate,
  type KaraokeDerivedState,
} from "../domain/formState"
import type { PriceType } from "../types"
import { useKaraokeForm } from "./karaokeFormContext"

interface KaraokeOrderPreviewProps {
  derived: KaraokeDerivedState
}

export function KaraokeOrderPreview({ derived }: KaraokeOrderPreviewProps) {
  const form = useKaraokeForm()
  const values = form.state.values
  const isEmpty = !values.eventName && !values.startDate && !derived.people

  return (
    <Card className="space-y-4 bg-card p-5 py-5">
      <p className="text-eyebrow">Bestillingsoversikt</p>
      {isEmpty ? (
        <p className="text-sm text-foreground/40 italic">
          Fyll ut skjemaet for å se en oversikt.
        </p>
      ) : (
        <div className="space-y-2 text-sm">
          <DetailRow label="Arrangement">{values.eventName}</DetailRow>
          <DetailRow label="Rom">Maos Lille Røde</DetailRow>
          {values.startDate && (
            <DetailRow label="Dato">
              <span className="capitalize">
                {formatKaraokeDate(values.startDate)}
              </span>
            </DetailRow>
          )}
          {derived.startTime && (
            <DetailRow label="Tid">
              {derived.startTime}
              {derived.endTime && ` → ${derived.endTime}`}
            </DetailRow>
          )}
          <DetailRow label="Varighet">
            {values.duration} {values.duration === 1 ? "time" : "timer"}
          </DetailRow>
          <DetailRow label="Pakke">
            <span className="capitalize">{values.priceType as string}</span>
          </DetailRow>
          {derived.people > 0 && (
            <DetailRow label="Antall">
              {derived.people} {derived.people === 1 ? "person" : "personer"}
            </DetailRow>
          )}
          <KaraokePriceSummary
            priceType={values.priceType as PriceType}
            people={derived.people}
            totalPrice={derived.totalPrice}
          />
        </div>
      )}
    </Card>
  )
}

function KaraokePriceSummary({
  priceType,
  people,
  totalPrice,
}: {
  priceType: PriceType
  people: number
  totalPrice: number
}) {
  if (priceType === "frivillig") {
    return (
      <div className="flex justify-between gap-4 border-t border-border pt-3 mt-3">
        <span className="text-foreground/60 shrink-0">Pris</span>
        <span className="font-heading text-primary text-lg">Gratis</span>
      </div>
    )
  }

  if (people <= 0) return null

  return (
    <div className="flex justify-between gap-4 border-t border-border pt-3 mt-3">
      <span className="text-foreground/60 shrink-0">Pris</span>
      <span className="font-heading text-primary text-lg">
        {totalPrice.toLocaleString("nb-NO")} kr
      </span>
    </div>
  )
}
