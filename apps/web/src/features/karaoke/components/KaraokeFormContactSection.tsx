"use client"

import type { AnyFieldApi } from "@tanstack/react-form"
import { FieldGroup } from "@/components/ui/field-group"
import { FormSection } from "@/components/ui/form-section"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useKaraokeForm } from "./karaokeFormContext"

interface KaraokeFormContactSectionProps {
  uid: string
  contactEmailError?: string
  contactEmailId: string
  contactNameError?: string
  contactNameId: string
}

export function KaraokeFormContactSection({
  uid,
  contactEmailError,
  contactEmailId,
  contactNameError,
  contactNameId,
}: KaraokeFormContactSectionProps) {
  const form = useKaraokeForm()
  const contactEmailErrorId = `${contactEmailId}-error`
  const contactNameErrorId = `${contactNameId}-error`

  return (
    <FormSection number="03" title="Kontaktinformasjon">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                onChange={event => field.handleChange(event.target.value)}
                placeholder="Fullt navn"
                required
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
                onChange={event => field.handleChange(event.target.value)}
                placeholder="din@epost.no"
                required
                type="email"
                value={field.state.value as string}
              />
            )}
          </form.Field>
        </FieldGroup>
      </div>

      <FieldGroup>
        <Label htmlFor={`${uid}-contactPhone`}>Telefon</Label>
        <form.Field name="contactPhone">
          {(field: AnyFieldApi) => (
            <Input
              className="max-w-48"
              autoComplete="tel"
              id={`${uid}-contactPhone`}
              inputMode="tel"
              onChange={event => field.handleChange(event.target.value)}
              placeholder="+47 55 55 55 55"
              type="tel"
              value={field.state.value as string}
            />
          )}
        </form.Field>
      </FieldGroup>
    </FormSection>
  )
}
