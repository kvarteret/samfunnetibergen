"use client"

import { Card } from "@/components/ui/card"
import { FormSection, SelectField } from "@/components/ui/form-fields"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { KARAOKE_PRICING, type KaraokeDerivedState } from "../domain/formState"
import type { PriceType } from "../types"
import { useKaraokeForm } from "./karaokeFormContext"

interface KaraokeFormPackageSectionProps {
  uid: string
  derived: KaraokeDerivedState
}

export function KaraokeFormPackageSection({
  uid,
  derived,
}: KaraokeFormPackageSectionProps) {
  const form = useKaraokeForm()
  const values = form.state.values

  return (
    <FormSection number="02" title="Karaokepakke">
      <SegmentedControl
        onChange={v => form.setFieldValue("priceType", v)}
        options={(["ordinær", "student", "frivillig"] as const).map(type => ({
          value: type,
          label: type,
        }))}
        value={values.priceType as PriceType}
        variant="fill"
      />
      <KaraokePackageNotice priceType={values.priceType as PriceType} />
      {values.priceType !== "frivillig" && <KaraokePeopleField uid={uid} />}
      {derived.people > 0 && values.priceType !== "frivillig" && (
        <KaraokeTotalPrice derived={derived} />
      )}
    </FormSection>
  )
}

function KaraokePackageNotice({ priceType }: { priceType: PriceType }) {
  if (priceType === "frivillig") {
    return (
      <Card className="space-y-2 bg-card p-4 py-4">
        <p className="text-sm font-heading text-foreground">
          Gratis for interne frivillige
        </p>
        <p className="text-sm text-foreground/70 leading-6">
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
      <div className="flex justify-between text-sm">
        <span className="text-foreground/60">Timepris per person</span>
        <span className="font-heading">
          {KARAOKE_PRICING[priceType].perPerson} kr
        </span>
      </div>
    </Card>
  )
}

function KaraokePeopleField({ uid }: { uid: string }) {
  const form = useKaraokeForm()
  const values = form.state.values

  return (
    <SelectField
      className="max-w-[180px]"
      hint={`Minimumspris er ${KARAOKE_PRICING[values.priceType as PriceType].minPerHour} kr per time.`}
      id={`${uid}-people`}
      label="Antall personer *"
      onChange={v => form.setFieldValue("numberOfPeople", v)}
      value={values.numberOfPeople}
    >
      {Array.from({ length: 25 }, (_, index) => index + 1).map(count => (
        <option key={count} value={count}>
          {count} {count === 1 ? "person" : "personer"}
        </option>
      ))}
    </SelectField>
  )
}

function KaraokeTotalPrice({ derived }: { derived: KaraokeDerivedState }) {
  return (
    <div className="border-2 border-primary bg-primary/5 p-4">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-foreground/70">Totalpris</span>
        <div className="text-right">
          <span className="font-heading text-2xl text-primary">
            {derived.totalPrice.toLocaleString("nb-NO")} kr
          </span>
          <p className="text-xs text-foreground/50 mt-0.5">
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
