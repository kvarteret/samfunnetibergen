"use client"

import type { AnyFieldApi } from "@tanstack/react-form"
import { useTranslations } from "next-intl"

import { FieldGroup } from "@/components/ui/field-group"
import { FormSection } from "@/components/ui/form-section"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useBookingForm } from "./bookingFormContext"

const PROMOTE_OPTIONS = [
  { value: "ja" as const, labelKey: "yes" as const },
  { value: "nei" as const, labelKey: "no" as const },
]

export function BookingPromotionSection({
  error,
  errorId,
}: {
  error?: string
  errorId: string
}) {
  const form = useBookingForm()
  const t = useTranslations("RoomBooking")
  const errorMessageId = `${errorId}-error`

  return (
    <FormSection number="08" title={t("promotion.sectionTitle")}>
      <p className="max-w-3xl leading-6 text-foreground-muted">
        {t("promotion.question")}
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
                    {t(`promotion.${opt.labelKey}`)}
                  </RadioGroupItem>
                ))}
              </RadioGroup>
            )}
          </form.Field>
        </div>
      </FieldGroup>

      {form.state.values.promote === "ja" && (
        <p className="max-w-3xl text-foreground-muted">
          {t("promotion.followUp")}
        </p>
      )}
    </FormSection>
  )
}
