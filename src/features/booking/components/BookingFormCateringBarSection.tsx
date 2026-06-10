"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */

import { UtensilsCrossed } from "lucide-react"
import { useId } from "react"
import { FormSection } from "@/components/ui/form-fields"
import { Textarea } from "@/components/ui/textarea"
import { ToggleOption } from "@/components/ui/toggle-option"
import { useBookingForm } from "./bookingFormContext"

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface Props {}

export function BookingFormCateringBarSection({}: Props) {
  const uid = useId()
  const form = useBookingForm()

  return (
    <FormSection number="05" title="Mat og bar">
      <div className="max-w-3xl space-y-4">
        <form.Field name="cateringCustom">
          {(field: any) => (
            <ToggleOption
              checked={field.state.value as boolean}
              icon={UtensilsCrossed}
              label="Skreddersydd meny"
              onChange={field.handleChange}
            >
              {(field.state.value as boolean) && (
                <div className="mt-3">
                  <form.Field name="cateringText">
                    {(textField: any) => (
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
          {(field: any) => (
            <ToggleOption
              checked={field.state.value as boolean}
              icon={UtensilsCrossed}
              label="Kvarteret stiller i bar"
              onChange={field.handleChange}
            >
              <p className="px-4 pb-4 text-xs text-foreground/55">
                Pris: 2000 kr eks. mva. Forutsetter kapasitet.
              </p>
            </ToggleOption>
          )}
        </form.Field>
      </div>
    </FormSection>
  )
}
