"use client"

import { useStore, type AnyFieldApi } from "@tanstack/react-form"
import { ComboboxField } from "@/components/ui/combobox-field"
import { FieldGroup, FieldHint } from "@/components/ui/field-group"
import { FormSection } from "@/components/ui/form-section"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { SelectOption } from "@/components/ui/select-field"
import { useEventForm } from "./eventFormContext"

interface EventFormOrganizerSectionProps {
  uid: string
  groupOptions: SelectOption[]
  organizerTextEnglishError?: string
  organizerTextError?: string
  number?: string
}

export function EventFormOrganizerSection({
  uid,
  groupOptions,
  organizerTextEnglishError,
  organizerTextError,
  number = "05",
}: EventFormOrganizerSectionProps) {
  const form = useEventForm()
  const organizerTextId = `${uid}-organizerText`
  const organizerTextErrorId = `${organizerTextId}-error`
  const organizerTextEnglishId = `${uid}-organizerText-en`
  const organizerTextEnglishErrorId = `${organizerTextEnglishId}-error`
  const hasOrganizerText = useStore(
    form.store,
    state => state.values.organizerText.trim().length > 0,
  )

  return (
    <FormSection number={number} title="Arrangør">
      <form.Field name="organizerGroup">
        {(field: AnyFieldApi) => (
          <ComboboxField
            hint="Om din gruppe er registrert på Kvarteret, velg den her."
            id={`${uid}-organizerGroup`}
            label="Gruppe på Kvarteret"
            onChange={field.handleChange}
            options={groupOptions}
            placeholder="Velg gruppe (valgfritt)"
            value={field.state.value as string}
          />
        )}
      </form.Field>

      <FieldGroup error={organizerTextError} errorId={organizerTextErrorId}>
        <Label htmlFor={organizerTextId}>Arrangørnavn (fritekst)</Label>
        <FieldHint>
          Bruk dette om dere ikke er i lista - f.eks. &quot;Bandet
          Skumringen&quot;, &quot;Fagutvalget ved MN&quot;.
        </FieldHint>
        <form.Field name="organizerText">
          {(field: AnyFieldApi) => (
            <Input
              autoComplete="organization"
              aria-describedby={
                organizerTextError ? organizerTextErrorId : undefined
              }
              aria-invalid={!!organizerTextError}
              id={organizerTextId}
              onChange={event => field.handleChange(event.target.value)}
              placeholder="Arrangørens navn"
              value={field.state.value as string}
            />
          )}
        </form.Field>
      </FieldGroup>

      <FieldGroup
        error={organizerTextEnglishError}
        errorId={organizerTextEnglishErrorId}
      >
        <Label htmlFor={organizerTextEnglishId}>Arrangørnavn (engelsk)</Label>
        <FieldHint>Påkrevd hvis du fyller ut arrangørnavn på norsk.</FieldHint>
        <form.Field name="organizerTextEnglish">
          {(field: AnyFieldApi) => (
            <Input
              aria-describedby={
                organizerTextEnglishError
                  ? organizerTextEnglishErrorId
                  : undefined
              }
              aria-invalid={!!organizerTextEnglishError}
              autoComplete="organization"
              id={organizerTextEnglishId}
              onChange={event => field.handleChange(event.target.value)}
              placeholder="Organizer name"
              required={hasOrganizerText}
              value={field.state.value as string}
            />
          )}
        </form.Field>
      </FieldGroup>
    </FormSection>
  )
}
