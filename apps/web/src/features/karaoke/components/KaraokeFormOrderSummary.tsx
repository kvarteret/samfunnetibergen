"use client"

import type { AnyFieldApi } from "@tanstack/react-form"
import { useLocale, useTranslations } from "next-intl"
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
  const t = useTranslations("Karaoke")
  const locale = useLocale()

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
                          {t("summary")}
                        </p>
                        {isEmpty ? (
                          <p className=" text-foreground-muted italic">
                            {t("summaryEmpty")}
                          </p>
                        ) : (
                          <div className="space-y-2">
                            <DetailRow label={t("event")}>
                              {eventName}
                            </DetailRow>
                            <DetailRow label={t("room")}>
                              Maos Lille Røde
                            </DetailRow>
                            {startDate && (
                              <DetailRow label={t("date")}>
                                <span className="capitalize">
                                  {formatKaraokeDate(startDate, locale)}
                                </span>
                              </DetailRow>
                            )}
                            {derived.startTime && (
                              <DetailRow label={t("time")}>
                                {derived.startTime}
                                {derived.endTime && ` → ${derived.endTime}`}
                              </DetailRow>
                            )}
                            <DetailRow label={t("duration")}>
                              {t("hours", { count: duration })}
                            </DetailRow>
                            <DetailRow label={t("packageLabel")}>
                              <span>
                                {t(
                                  priceType === "ordinær"
                                    ? "regular"
                                    : priceType === "student"
                                      ? "student"
                                      : "volunteer",
                                )}
                              </span>
                            </DetailRow>
                            {derived.people > 0 && (
                              <DetailRow label={t("count")}>
                                {t("people", { count: derived.people })}
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
  const t = useTranslations("Karaoke")
  const locale = useLocale()

  if (priceType === "frivillig") {
    return (
      <div className="flex justify-between gap-4 border-t border-border pt-3 mt-3">
        <span className="text-foreground-muted shrink-0">{t("price")}</span>
        <span className="font-heading text-primary text-lg">{t("free")}</span>
      </div>
    )
  }

  if (people <= 0) return null

  return (
    <div className="flex justify-between gap-4 border-t border-border pt-3 mt-3">
      <span className="text-foreground-muted shrink-0">{t("price")}</span>
      <span className="font-heading text-primary text-lg">
        {totalPrice.toLocaleString(locale === "en" ? "en-GB" : "nb-NO")} kr
      </span>
    </div>
  )
}
