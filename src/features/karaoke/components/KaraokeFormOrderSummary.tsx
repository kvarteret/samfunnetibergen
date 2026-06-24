"use client"

import type { AnyFieldApi } from "@tanstack/react-form"
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

  return (
    <form.Field name="eventName">
      {(eventNameField: AnyFieldApi) => (
        <form.Field name="startDate">
          {(dateField: AnyFieldApi) => (
            <form.Field name="duration">
              {(durationField: AnyFieldApi) => (
                <form.Field name="priceType">
                  {(priceTypeField: AnyFieldApi) => {
                    const eventName = eventNameField.state.value as string
                    const startDate = dateField.state.value as string
                    const duration = durationField.state.value as number
                    const priceType = priceTypeField.state.value as PriceType
                    const isEmpty = !eventName && !startDate && !derived.people

                    return (
                      <Card className="space-y-4 bg-card p-5 py-5">
                        <p className="font-heading uppercase tracking-widest">
                          Bestillingsoversikt
                        </p>
                        {isEmpty ? (
                          <p className=" text-foreground-muted italic">
                            Fyll ut skjemaet for å se en oversikt.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            <DetailRow label="Arrangement">
                              {eventName}
                            </DetailRow>
                            <DetailRow label="Rom">Maos Lille Røde</DetailRow>
                            {startDate && (
                              <DetailRow label="Dato">
                                <span className="capitalize">
                                  {formatKaraokeDate(startDate)}
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
                              {duration} {duration === 1 ? "time" : "timer"}
                            </DetailRow>
                            <DetailRow label="Pakke">
                              <span className="capitalize">{priceType}</span>
                            </DetailRow>
                            {derived.people > 0 && (
                              <DetailRow label="Antall">
                                {derived.people}{" "}
                                {derived.people === 1 ? "person" : "personer"}
                              </DetailRow>
                            )}
                            <KaraokePriceSummary
                              people={derived.people}
                              priceType={priceType}
                              totalPrice={derived.totalPrice}
                            />
                          </div>
                        )}
                      </Card>
                    )
                  }}
                </form.Field>
              )}
            </form.Field>
          )}
        </form.Field>
      )}
    </form.Field>
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
        <span className="text-foreground-muted shrink-0">Pris</span>
        <span className="font-heading text-primary text-lg">Gratis</span>
      </div>
    )
  }

  if (people <= 0) return null

  return (
    <div className="flex justify-between gap-4 border-t border-border pt-3 mt-3">
      <span className="text-foreground-muted shrink-0">Pris</span>
      <span className="font-heading text-primary text-lg">
        {totalPrice.toLocaleString("nb-NO")} kr
      </span>
    </div>
  )
}
