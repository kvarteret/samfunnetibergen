"use client"

import type { AnyFieldApi } from "@tanstack/react-form"
import { useId } from "react"
import { FieldGroup } from "@/components/ui/field-group"
import { FormSection } from "@/components/ui/form-section"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { BookerType } from "../domain/formState"
import { isExternalBooker } from "../domain/formState"
import { useBookingForm } from "./bookingFormContext"

interface BookingFormContactSectionProps {
  contactEmailError?: string
  contactEmailId: string
  contactNameError?: string
  contactNameId: string
  invoiceAddressError?: string
  invoiceAddressId: string
}

export function BookingFormContactSection({
  contactEmailError,
  contactEmailId,
  contactNameError,
  contactNameId,
  invoiceAddressError,
  invoiceAddressId,
}: BookingFormContactSectionProps) {
  const uid = useId()
  const form = useBookingForm()
  const bookerType = form.state.values.bookerType as BookerType
  const isExternal = isExternalBooker(bookerType)
  const contactEmailErrorId = `${contactEmailId}-error`
  const contactNameErrorId = `${contactNameId}-error`
  const invoiceAddressErrorId = `${invoiceAddressId}-error`

  return (
    <FormSection number="05" title="Kontaktinformasjon">
      <div className="grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldGroup error={contactNameError} errorId={contactNameErrorId}>
          <Label htmlFor={contactNameId}>Navn *</Label>
          <form.Field name="contactName">
            {(field: AnyFieldApi) => (
              <Input
                aria-describedby={
                  contactNameError ? contactNameErrorId : undefined
                }
                aria-invalid={!!contactNameError}
                autoComplete="name"
                id={contactNameId}
                onChange={e => field.handleChange(e.target.value)}
                placeholder="Fullt navn"
                value={field.state.value as string}
              />
            )}
          </form.Field>
        </FieldGroup>
        <FieldGroup error={contactEmailError} errorId={contactEmailErrorId}>
          <Label htmlFor={contactEmailId}>E-post *</Label>
          <form.Field name="contactEmail">
            {(field: AnyFieldApi) => (
              <Input
                aria-describedby={
                  contactEmailError ? contactEmailErrorId : undefined
                }
                aria-invalid={!!contactEmailError}
                autoComplete="email"
                id={contactEmailId}
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
            {(field: AnyFieldApi) => (
              <Input
                autoComplete="tel"
                id={`${uid}-contactPhone`}
                inputMode="tel"
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
              {(field: AnyFieldApi) => (
                <FieldGroup
                  error={invoiceAddressError}
                  errorId={invoiceAddressErrorId}
                >
                  <Label htmlFor={invoiceAddressId}>Fakturaadresse *</Label>
                  <Input
                    aria-describedby={
                      invoiceAddressError ? invoiceAddressErrorId : undefined
                    }
                    aria-invalid={!!invoiceAddressError}
                    autoComplete="street-address"
                    id={invoiceAddressId}
                    onChange={e => field.handleChange(e.target.value)}
                    placeholder="Adresse for faktura"
                    value={field.state.value as string}
                  />
                </FieldGroup>
              )}
            </form.Field>
            <form.Field name="orgNumber">
              {(field: AnyFieldApi) => (
                <FieldGroup>
                  <Label htmlFor={`${uid}-orgNumber`}>Org.nr.</Label>
                  <Input
                    id={`${uid}-orgNumber`}
                    inputMode="numeric"
                    onChange={e => field.handleChange(e.target.value)}
                    placeholder="Valgfritt"
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
