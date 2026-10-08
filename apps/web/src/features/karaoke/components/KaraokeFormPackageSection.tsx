"use client"

import type { AnyFieldApi } from "@tanstack/react-form"
import { useLocale, useTranslations } from "next-intl"
import { Card } from "@/components/ui/card"
import { FormSection } from "@/components/ui/form-section"
import { menuPanelClassName } from "@/components/ui/menu-surface"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { SelectField } from "@/components/ui/select-field"
import { cn } from "@/lib/utils"
import { KARAOKE_PRICING, type KaraokeDerivedState } from "../domain/formState"
import type { PriceType } from "../types"
import { useKaraokeForm } from "./karaokeFormContext"

interface KaraokeFormPackageSectionProps {
  uid: string
  derived: KaraokeDerivedState
  numberOfPeopleError?: string
  numberOfPeopleId: string
}

export function KaraokeFormPackageSection({
  uid,
  derived,
  numberOfPeopleError,
  numberOfPeopleId,
}: KaraokeFormPackageSectionProps) {
  const t = useTranslations("Karaoke")

  const form = useKaraokeForm()

  return (
    <FormSection number="02" title={t("package")}>
      <form.Field name="priceType">
        {(field: AnyFieldApi) => {
          const priceType = field.state.value as PriceType

          return (
            <>
              <SegmentedControl
                className="capitalize"
                onValueChange={field.handleChange}
                options={(["ordinær", "student", "frivillig"] as const).map(
                  type => ({
                    value: type,
                    label: t(
                      type === "ordinær"
                        ? "regular"
                        : type === "student"
                          ? "student"
                          : "volunteer",
                    ),
                  }),
                )}
                value={priceType}
                variant="fill"
              />
              <KaraokePackageNotice priceType={priceType} />
              {priceType !== "frivillig" && (
                <KaraokePeopleField
                  error={numberOfPeopleError}
                  errorId={`${numberOfPeopleId}-error`}
                  id={numberOfPeopleId}
                  priceType={priceType}
                  uid={uid}
                />
              )}
              {derived.people > 0 && priceType !== "frivillig" && (
                <KaraokeTotalPrice derived={derived} />
              )}
            </>
          )
        }}
      </form.Field>
    </FormSection>
  )
}

function KaraokePackageNotice({ priceType }: { priceType: PriceType }) {
  const t = useTranslations("Karaoke")

  if (priceType === "frivillig") {
    return (
      <Card className="space-y-2 bg-card p-4 py-4">
        <p className=" font-heading text-foreground">{t("volunteerFree")}</p>
        <p className=" text-foreground-muted leading-6">
          {t("volunteerNotice")}
        </p>
      </Card>
    )
  }

  return (
    <Card className="bg-card p-4 py-4">
      <div className="flex justify-between">
        <span className="text-foreground-muted">{t("hourlyPerson")}</span>
        <span className="font-heading">
          {KARAOKE_PRICING[priceType].perPerson} kr
        </span>
      </div>
    </Card>
  )
}

function KaraokePeopleField({
  uid,
  priceType,
  error,
  errorId,
  id,
}: {
  uid: string
  priceType: PriceType
  error?: string
  errorId: string
  id: string
}) {
  const t = useTranslations("Karaoke")

  const form = useKaraokeForm()

  return (
    <form.Field name="numberOfPeople">
      {(field: AnyFieldApi) => (
        <SelectField
          className="max-w-44"
          error={error}
          errorId={errorId}
          hint={t("minimum", { price: KARAOKE_PRICING[priceType].minPerHour })}
          id={id || `${uid}-people`}
          label={t("peopleLabel")}
          onChange={field.handleChange}
          options={Array.from({ length: 25 }, (_, index) => index + 1).map(
            count => ({
              value: String(count),
              label: t("people", { count }),
            }),
          )}
          value={field.state.value as string}
        />
      )}
    </form.Field>
  )
}

function KaraokeTotalPrice({ derived }: { derived: KaraokeDerivedState }) {
  const locale = useLocale()
  const t = useTranslations("Karaoke")

  return (
    <div className={cn(menuPanelClassName, "p-4")}>
      <div className="flex items-baseline justify-between">
        <span className="text-foreground-muted">{t("totalPrice")}</span>
        <div className="text-right">
          <span className="font-heading text-2xl tabular-nums text-foreground">
            {derived.totalPrice.toLocaleString(
              locale === "en" ? "en-GB" : "nb-NO",
            )}{" "}
            kr
          </span>
          <p className="text-sm text-foreground-muted mt-0.5">
            {t("perPerson", {
              price: Math.round(derived.totalPrice / derived.people),
            })}
          </p>
        </div>
      </div>
    </div>
  )
}
