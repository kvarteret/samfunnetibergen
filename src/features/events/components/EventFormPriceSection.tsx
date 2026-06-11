"use client"

import { CheckboxField } from "@/components/ui/checkbox-field"
import { FieldHint } from "@/components/ui/field-group"
import { FormSection } from "@/components/ui/form-section"
import { PriceInput } from "@/components/ui/price-input"
import { useEventForm } from "./eventFormContext"

interface EventFormPriceSectionProps {
  uid: string
}

export function EventFormPriceSection({ uid }: EventFormPriceSectionProps) {
  const form = useEventForm()
  const values = form.state.values

  return (
    <FormSection number="06" title="Pris">
      <CheckboxField
        checked={values.isFree}
        label="Gratis inngang"
        onChange={v => form.setFieldValue("isFree", v)}
      />

      {!values.isFree && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <PriceInput
            id={`${uid}-priceOrdinar`}
            label="Ordinær"
            onChange={v => form.setFieldValue("priceOrdinar", v)}
            value={values.priceOrdinar}
          />
          <PriceInput
            id={`${uid}-priceStudent`}
            label="Student"
            onChange={v => form.setFieldValue("priceStudent", v)}
            value={values.priceStudent}
          />
          <PriceInput
            id={`${uid}-priceMedlem`}
            label="Medlem"
            onChange={v => form.setFieldValue("priceMedlem", v)}
            value={values.priceMedlem}
          />
        </div>
      )}

      <FieldHint>
        Alle prisfelt er valgfrie. La dem stå tomme om du er usikker - vi tar
        gjerne kontakt for avklaring.
      </FieldHint>
    </FormSection>
  )
}
