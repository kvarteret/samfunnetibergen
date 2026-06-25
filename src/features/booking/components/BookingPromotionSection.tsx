"use client"

import type { AnyFieldApi } from "@tanstack/react-form"

import { FormSection } from "@/components/ui/form-section"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useBookingForm } from "./bookingFormContext"

const PROMOTE_OPTIONS = [
  { value: "ja", label: "Ja, takk" },
  { value: "nei", label: "Nei, takk" },
]

export function BookingPromotionSection() {
  const form = useBookingForm()

  return (
    <FormSection number="08" title="Promotering">
      <p className="max-w-3xl leading-6 text-foreground-muted">
        Ønsker du at Studentersamfunnet promoterer ditt arrangement på sine
        kanaler?
      </p>

      <form.Field name="promote">
        {(field: AnyFieldApi) => (
          <RadioGroup<string>
            onValueChange={field.handleChange}
            value={field.state.value as string}
          >
            {PROMOTE_OPTIONS.map(opt => (
              <RadioGroupItem key={opt.value} value={opt.value}>
                {opt.label}
              </RadioGroupItem>
            ))}
          </RadioGroup>
        )}
      </form.Field>

      {form.state.values.promote === "ja" && (
        <p className="max-w-3xl text-foreground-muted">
          Vi sender en lenke på e-post etter bookingen er sendt.
        </p>
      )}
    </FormSection>
  )
}
