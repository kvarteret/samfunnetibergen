"use client"

import { FieldGroup } from "@/components/ui/field-group"
import { FormSection } from "@/components/ui/form-section"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEventForm } from "./eventFormContext"

interface EventFormSubmitterSectionProps {
  uid: string
  submittedByEmailError?: string
  submittedByEmailId: string
  submittedByError?: string
  submittedById: string
}

export function EventFormSubmitterSection({
  uid,
  submittedByEmailError,
  submittedByEmailId,
  submittedByError,
  submittedById,
}: EventFormSubmitterSectionProps) {
  const form = useEventForm()
  const submittedByEmailErrorId = `${submittedByEmailId}-error`
  const submittedByErrorId = `${submittedById}-error`

  return (
    <FormSection number="08" title="Kontaktinformasjon">
      <p className="text-sm leading-6 text-foreground-subtle">
        Vi trenger en kontaktperson for arrangementet. Informasjonen vises ikke
        offentlig - den brukes bare av Kvarterets PR-gruppe til å følge opp
        innmeldingen.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldGroup error={submittedByError} errorId={submittedByErrorId}>
          <Label htmlFor={submittedById}>Ditt navn *</Label>
          <Input
            aria-describedby={submittedByError ? submittedByErrorId : undefined}
            aria-invalid={!!submittedByError}
            autoComplete="name"
            id={submittedById}
            onChange={event =>
              form.setFieldValue("submittedBy", event.target.value)
            }
            placeholder="Fullt navn"
            required
            value={form.state.values.submittedBy}
          />
        </FieldGroup>

        <FieldGroup
          error={submittedByEmailError}
          errorId={submittedByEmailErrorId}
        >
          <Label htmlFor={submittedByEmailId}>E-postadresse *</Label>
          <Input
            aria-describedby={
              submittedByEmailError ? submittedByEmailErrorId : undefined
            }
            aria-invalid={!!submittedByEmailError}
            autoComplete="email"
            id={submittedByEmailId}
            onChange={event =>
              form.setFieldValue("submittedByEmail", event.target.value)
            }
            placeholder="epost@eksempel.no"
            required
            type="email"
            value={form.state.values.submittedByEmail}
          />
        </FieldGroup>
      </div>

      <FieldGroup>
        <Label htmlFor={`${uid}-org`}>Organisasjon / gruppe</Label>
        <Input
          autoComplete="organization"
          id={`${uid}-org`}
          onChange={event =>
            form.setFieldValue("submittedByOrganization", event.target.value)
          }
          placeholder="F.eks. Bandet Skumringen, Realfagskollegiet"
          value={form.state.values.submittedByOrganization}
        />
      </FieldGroup>
    </FormSection>
  )
}
