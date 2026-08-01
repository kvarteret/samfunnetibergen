"use client"

import type { AnyFieldApi } from "@tanstack/react-form"
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
  number?: string
  title?: string
}

export function EventFormSubmitterSection({
  uid,
  submittedByEmailError,
  submittedByEmailId,
  submittedByError,
  submittedById,
  number = "08",
  title = "Kontaktinformasjon",
}: EventFormSubmitterSectionProps) {
  const form = useEventForm()
  const submittedByEmailErrorId = `${submittedByEmailId}-error`
  const submittedByErrorId = `${submittedById}-error`

  return (
    <FormSection number={number} title={title}>
      <p className=" leading-6 text-foreground-muted">
        Vi trenger en kontaktperson for arrangementet. Informasjonen vises ikke
        offentlig - den brukes bare av Kvarterets PR-gruppe til å følge opp
        innmeldingen.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldGroup error={submittedByError} errorId={submittedByErrorId}>
          <Label htmlFor={submittedById}>Ditt navn *</Label>
          <form.Field name="submittedBy">
            {(field: AnyFieldApi) => (
              <Input
                aria-describedby={
                  submittedByError ? submittedByErrorId : undefined
                }
                aria-invalid={!!submittedByError}
                autoComplete="name"
                id={submittedById}
                onChange={event => field.handleChange(event.target.value)}
                placeholder="Fullt navn"
                required
                value={field.state.value as string}
              />
            )}
          </form.Field>
        </FieldGroup>

        <FieldGroup
          error={submittedByEmailError}
          errorId={submittedByEmailErrorId}
        >
          <Label htmlFor={submittedByEmailId}>E-postadresse *</Label>
          <form.Field name="submittedByEmail">
            {(field: AnyFieldApi) => (
              <Input
                aria-describedby={
                  submittedByEmailError ? submittedByEmailErrorId : undefined
                }
                aria-invalid={!!submittedByEmailError}
                autoComplete="email"
                id={submittedByEmailId}
                onChange={event => field.handleChange(event.target.value)}
                placeholder="epost@eksempel.no"
                required
                type="email"
                value={field.state.value as string}
              />
            )}
          </form.Field>
        </FieldGroup>
      </div>

      <FieldGroup>
        <Label htmlFor={`${uid}-org`}>Organisasjon / gruppe</Label>
        <form.Field name="submittedByOrganization">
          {(field: AnyFieldApi) => (
            <Input
              autoComplete="organization"
              id={`${uid}-org`}
              onChange={event => field.handleChange(event.target.value)}
              placeholder="F.eks. Bandet Skumringen, Realfagskollegiet"
              value={field.state.value as string}
            />
          )}
        </form.Field>
      </FieldGroup>
    </FormSection>
  )
}
