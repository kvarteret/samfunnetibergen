"use client"

import type { AnyFieldApi } from "@tanstack/react-form"
import { UtensilsCrossed } from "lucide-react"
import { useId } from "react"
import { FormSection } from "@/components/ui/form-section"
import { Textarea } from "@/components/ui/textarea"
import { ToggleOption } from "@/components/ui/toggle-option"
import { useBookingForm } from "./bookingFormContext"

export function BookingFormCateringBarSection() {
  const uid = useId()
  const form = useBookingForm()

  return (
    <FormSection number="05" title="Mat og bar">
      <div className="max-w-3xl space-y-4">
        <form.Field name="cateringCustom">
          {(field: AnyFieldApi) => (
            <ToggleOption
              checked={field.state.value as boolean}
              icon={UtensilsCrossed}
              label="Skreddersydd meny"
              onChange={field.handleChange}
            >
              {(field.state.value as boolean) && (
                <div className="mt-3">
                  <form.Field name="cateringText">
                    {(textField: AnyFieldApi) => (
                      <Textarea
                        className="resize-y"
                        id={`${uid}-catering`}
                        onChange={e => textField.handleChange(e.target.value)}
                        placeholder="Beskriv ønsker om mat, snacks eller drikke."
                        rows={4}
                        value={textField.state.value as string}
                      />
                    )}
                  </form.Field>
                </div>
              )}
            </ToggleOption>
          )}
        </form.Field>
        <form.Field name="bar">
          {(field: AnyFieldApi) => (
            <ToggleOption
              checked={field.state.value as boolean}
              icon={UtensilsCrossed}
              label="Kvarteret stiller i bar"
              onChange={field.handleChange}
            >
              <p className="px-4 pb-4 text-xs text-foreground-subtle">
                Pris: 2000 kr eks. mva. Forutsetter kapasitet.
              </p>
            </ToggleOption>
          )}
        </form.Field>
      </div>
    </FormSection>
  )
}
