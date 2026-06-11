"use client"

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
          <Input
            aria-describedby={contactNameError ? contactNameErrorId : undefined}
            aria-invalid={!!contactNameError}
            autoComplete="name"
            id={contactNameId}
            onChange={event =>
              form.setFieldValue("contactName", event.target.value)
            }
            placeholder="Fullt navn"
            required
            value={form.state.values.contactName}
          />
        </FieldGroup>

        <FieldGroup error={contactEmailError} errorId={contactEmailErrorId}>
          <Label htmlFor={contactEmailId}>E-post *</Label>
          <Input
            aria-describedby={
              contactEmailError ? contactEmailErrorId : undefined
            }
            aria-invalid={!!contactEmailError}
            autoComplete="email"
            id={contactEmailId}
            onChange={event =>
              form.setFieldValue("contactEmail", event.target.value)
            }
            placeholder="din@epost.no"
            required
            type="email"
            value={form.state.values.contactEmail}
          />
        </FieldGroup>
      </div>

      <FieldGroup>
        <Label htmlFor={`${uid}-contactPhone`}>Telefon</Label>
        <Input
          className="max-w-48"
          autoComplete="tel"
          id={`${uid}-contactPhone`}
          inputMode="tel"
          onChange={event =>
            form.setFieldValue("contactPhone", event.target.value)
          }
          placeholder="+47 55 55 55 55"
          type="tel"
          value={form.state.values.contactPhone}
        />
      </FieldGroup>
    </FormSection>
  )
}
