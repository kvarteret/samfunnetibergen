"use client"

import type { ReactNode } from "react"

import { Card } from "@/components/ui/card"
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
      <p className="font-heading text-xs uppercase tracking-[0.18em] text-foreground/60">
        Bestillingsoversikt
      </p>
      {isEmpty ? (
        <p className="text-sm text-foreground/40 italic">
          Fyll ut skjemaet for å se en oversikt.
        </p>
      ) : (
        <div className="space-y-2 text-sm">
          {values.eventName && (
            <KaraokeSummaryRow label="Arrangement">
              {values.eventName}
            </KaraokeSummaryRow>
          )}
          <KaraokeSummaryRow label="Rom">Maos Lille Røde</KaraokeSummaryRow>
          {values.startDate && (
            <KaraokeSummaryRow label="Dato">
              <span className="capitalize">
                {formatKaraokeDate(values.startDate)}
              </span>
            </KaraokeSummaryRow>
          )}
          {derived.startTime && (
            <KaraokeSummaryRow label="Tid">
              {derived.startTime}
              {derived.endTime && ` → ${derived.endTime}`}
            </KaraokeSummaryRow>
          )}
          <KaraokeSummaryRow label="Varighet">
            {values.duration} {values.duration === 1 ? "time" : "timer"}
          </KaraokeSummaryRow>
          <KaraokeSummaryRow label="Pakke">
            <span className="capitalize">{values.priceType as string}</span>
          </KaraokeSummaryRow>
          {derived.people > 0 && (
            <KaraokeSummaryRow label="Antall">
              {derived.people} {derived.people === 1 ? "person" : "personer"}
            </KaraokeSummaryRow>
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

function KaraokeSummaryRow({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-foreground/60 shrink-0">{label}</span>
      <span className="font-heading text-right truncate">{children}</span>
    </div>
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
