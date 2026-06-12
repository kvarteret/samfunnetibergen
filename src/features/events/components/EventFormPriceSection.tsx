"use client"

import type { AnyFieldApi } from "@tanstack/react-form"
import { CheckboxField } from "@/components/ui/checkbox-field"
import { FormSection } from "@/components/ui/form-section"
import { PriceInput } from "@/components/ui/price-input"
import { useEventForm } from "./eventFormContext"

interface EventFormPriceSectionProps {
  uid: string
}

export function EventFormPriceSection({ uid }: EventFormPriceSectionProps) {
  const form = useEventForm()

  return (
    <FormSection number="06" title="Pris">
      <form.Field name="isFree">
        {(field: AnyFieldApi) => (
          <>
            <CheckboxField
              checked={field.state.value as boolean}
              label="Gratis inngang"
              onChange={field.handleChange}
            />
            {!field.state.value && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <EventPriceField
                  id={`${uid}-priceOrdinar`}
                  label="Ordinær"
                  name="priceOrdinar"
                />
                <EventPriceField
                  id={`${uid}-priceStudent`}
                  label="Student"
                  name="priceStudent"
                />
                <EventPriceField
                  id={`${uid}-priceMedlem`}
                  label="Medlem"
                  name="priceMedlem"
                />
              </div>
            )}
          </>
        )}
      </form.Field>

      <p className="text-sm text-foreground-muted">
        Alle prisfelt er valgfrie. La dem stå tomme om du er usikker - vi tar
        gjerne kontakt for avklaring.
      </p>
    </FormSection>
  )
}

function EventPriceField({
  id,
  label,
  name,
}: {
  id: string
  label: string
  name: "priceOrdinar" | "priceStudent" | "priceMedlem"
}) {
  const form = useEventForm()

  return (
    <form.Field name={name}>
      {(field: AnyFieldApi) => (
        <PriceInput
          id={id}
          label={label}
          onChange={field.handleChange}
          value={field.state.value as string}
        />
      )}
    </form.Field>
  )
}
