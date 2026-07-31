"use client"

import type { AnyFieldApi } from "@tanstack/react-form"

import { FieldGroup } from "@/components/ui/field-group"
import { FormSection } from "@/components/ui/form-section"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useBookingForm } from "./bookingFormContext"

const PROMOTE_OPTIONS = [
  { value: "ja", label: "Ja, takk" },
  { value: "nei", label: "Nei, takk" },
]

export function BookingPromotionSection({
  error,
  errorId,
}: {
  error?: string
  errorId: string
}) {
  const form = useBookingForm()
  const errorMessageId = `${errorId}-error`

  return (
    <FormSection number="08" title="Promotering">
      <p className="max-w-3xl leading-6 text-foreground-muted">
        Ønsker du at Studentersamfunnet promoterer ditt arrangement på sine
        kanaler?
      </p>

      <FieldGroup error={error} errorId={errorMessageId}>
        <div id={errorId} tabIndex={-1}>
          <form.Field name="promote">
            {(field: AnyFieldApi) => (
              <RadioGroup<string>
                aria-describedby={error ? errorMessageId : undefined}
                aria-invalid={!!error}
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
        </div>
      </FieldGroup>

      {form.state.values.promote === "ja" && (
        <p className="max-w-3xl text-foreground-muted">
          Vi sender en lenke på e-post etter bookingen er sendt.
        </p>
      )}
    </FormSection>
  )
}
