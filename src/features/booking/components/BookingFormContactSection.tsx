"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useId } from "react"
import { FieldGroup } from "@/components/ui/field-group"
import { FormSection } from "@/components/ui/form-section"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { BookerType } from "../domain/formState"
import { isExternalBooker } from "../domain/formState"
import { useBookingForm } from "./bookingFormContext"

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface Props {}

export function BookingFormContactSection({}: Props) {
  const uid = useId()
  const form = useBookingForm()
  const bookerType = form.state.values.bookerType as BookerType
  const isExternal = isExternalBooker(bookerType)

  return (
    <FormSection number="07" title="Kontaktinformasjon">
      <div className="grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldGroup>
          <Label htmlFor={`${uid}-contactName`}>Navn *</Label>
          <form.Field name="contactName">
            {(field: any) => (
              <Input
                autoComplete="name"
                id={`${uid}-contactName`}
                onChange={e => field.handleChange(e.target.value)}
                placeholder="Fullt navn"
                value={field.state.value as string}
              />
            )}
          </form.Field>
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor={`${uid}-contactEmail`}>E-post *</Label>
          <form.Field name="contactEmail">
            {(field: any) => (
              <Input
                autoComplete="email"
                id={`${uid}-contactEmail`}
                onChange={e => field.handleChange(e.target.value)}
                placeholder="din@epost.no"
                type="email"
                value={field.state.value as string}
              />
            )}
          </form.Field>
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor={`${uid}-contactPhone`}>Telefon</Label>
          <form.Field name="contactPhone">
            {(field: any) => (
              <Input
                autoComplete="tel"
                id={`${uid}-contactPhone`}
                onChange={e => field.handleChange(e.target.value)}
                placeholder="+47 55 55 55 55"
                type="tel"
                value={field.state.value as string}
              />
            )}
          </form.Field>
        </FieldGroup>
        {isExternal && (
          <>
            <form.Field name="invoiceAddress">
              {(field: any) => (
                <FieldGroup>
                  <Label htmlFor={`${uid}-invoiceAddress`}>
                    Fakturaadresse *
                  </Label>
                  <Input
                    id={`${uid}-invoiceAddress`}
                    onChange={e => field.handleChange(e.target.value)}
                    placeholder="Adresse for faktura"
                    value={field.state.value as string}
                  />
                </FieldGroup>
              )}
            </form.Field>
            <form.Field name="orgNumber">
              {(field: any) => (
                <FieldGroup>
                  <Label htmlFor={`${uid}-orgNumber`}>Org.nr.</Label>
                  <Input
                    id={`${uid}-orgNumber`}
                    onChange={e => field.handleChange(e.target.value)}
                    placeholder="Valgfritt"
                    type="number"
                    value={field.state.value as string}
                  />
                </FieldGroup>
              )}
            </form.Field>
          </>
        )}
      </div>
    </FormSection>
  )
}
