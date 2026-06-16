"use client"

import type { AnyFieldApi } from "@tanstack/react-form"
import { useId } from "react"
import { FieldGroup } from "@/components/ui/field-group"
import { FormSection } from "@/components/ui/form-section"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { BookingFormValues } from "./BookingForm"
import { useBookingForm } from "./bookingFormContext"

const FREE_PAID_OPTIONS = [
  { value: "Gratis", label: "Gratis" },
  { value: "Betalt", label: "Betalt" },
]

export function BookingFormTicketSection() {
  const uid = useId()
  const form = useBookingForm()
  return (
    <FormSection number="04" title="Billett">
      <div className="grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        <form.Field name="freeOrPaid">
          {(field: AnyFieldApi) => (
            <RadioGroup<string>
              onValueChange={field.handleChange}
              value={field.state.value as string}
            >
              {FREE_PAID_OPTIONS.map(opt => (
                <RadioGroupItem key={opt.value} value={opt.value}>
                  {opt.label}
                </RadioGroupItem>
              ))}
            </RadioGroup>
          )}
        </form.Field>
        <form.Subscribe
          selector={(s: { values: BookingFormValues }) => s.values.freeOrPaid}
        >
          {(freeOrPaid: string) =>
            freeOrPaid === "Betalt" ? (
              <FieldGroup>
                <Label htmlFor={`${uid}-tickets`}>Billettyper og priser</Label>
                <form.Field name="ticketTypes">
                  {(field: AnyFieldApi) => (
                    <Input
                      id={`${uid}-tickets`}
                      onChange={e => field.handleChange(e.target.value)}
                      placeholder="F.eks. Ordinær 150 kr, student 100 kr"
                      value={field.state.value as string}
                    />
                  )}
                </form.Field>
              </FieldGroup>
            ) : null
          }
        </form.Subscribe>
      </div>
    </FormSection>
  )
}
