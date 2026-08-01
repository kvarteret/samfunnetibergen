"use client"

import type { AnyFieldApi } from "@tanstack/react-form"
import { Card } from "@/components/ui/card"
import { FormSection } from "@/components/ui/form-section"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { SelectField } from "@/components/ui/select-field"
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
  const form = useKaraokeForm()

  return (
    <FormSection number="02" title="Karaokepakke">
      <form.Field name="priceType">
        {(field: AnyFieldApi) => {
          const priceType = field.state.value as PriceType

          return (
            <>
              <SegmentedControl
                onValueChange={field.handleChange}
                options={(["ordinær", "student", "frivillig"] as const).map(
                  type => ({
                    value: type,
                    label: type,
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
  if (priceType === "frivillig") {
    return (
      <Card className="space-y-2 bg-card p-4 py-4">
        <p className=" font-heading text-foreground">
          Gratis for interne frivillige
        </p>
        <p className=" text-foreground-muted leading-6">
          Som intern frivillig kan du bruke karaokerommet gratis, men eksterne
          bookinger har alltid prioritet. En ekstern booking kan overta rommet
          ved å booke senest{" "}
          <strong className="font-heading text-foreground">12 timer før</strong>{" "}
          — i så fall vil du bli varslet og bookingen din kanselleres.
        </p>
      </Card>
    )
  }

  return (
    <Card className="bg-card p-4 py-4">
      <div className="flex justify-between">
        <span className="text-foreground-muted">Timepris per person</span>
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
  const form = useKaraokeForm()

  return (
    <form.Field name="numberOfPeople">
      {(field: AnyFieldApi) => (
        <SelectField
          className="max-w-44"
          error={error}
          errorId={errorId}
          hint={`Minimumspris er ${KARAOKE_PRICING[priceType].minPerHour} kr per time.`}
          id={id || `${uid}-people`}
          label="Antall personer *"
          onChange={field.handleChange}
          options={Array.from({ length: 25 }, (_, index) => index + 1).map(
            count => ({
              value: String(count),
              label: `${count} ${count === 1 ? "person" : "personer"}`,
            }),
          )}
          value={field.state.value as string}
        />
      )}
    </form.Field>
  )
}

function KaraokeTotalPrice({ derived }: { derived: KaraokeDerivedState }) {
  return (
    <div className="border-2 border-primary bg-primary/5 p-4">
      <div className="flex items-baseline justify-between">
        <span className=" text-foreground-muted">Totalpris</span>
        <div className="text-right">
          <span className="font-heading text-2xl text-primary">
            {derived.totalPrice.toLocaleString("nb-NO")} kr
          </span>
          <p className="text-sm text-foreground-muted mt-0.5">
            {Math.round(derived.totalPrice / derived.people).toLocaleString(
              "nb-NO",
            )}{" "}
            kr per person
          </p>
        </div>
      </div>
    </div>
  )
}
