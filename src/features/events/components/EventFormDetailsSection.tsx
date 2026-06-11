"use client"

import type { AnyFieldApi } from "@tanstack/react-form"
import { CheckboxField } from "@/components/ui/checkbox-field"
import { FieldGroup, FieldHint } from "@/components/ui/field-group"
import { FormSection } from "@/components/ui/form-section"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SelectField, type SelectOption } from "@/components/ui/select-field"
import { Textarea } from "@/components/ui/textarea"
import { useEventForm } from "./eventFormContext"

interface EventFormDetailsSectionProps {
  uid: string
  eventTypeOptions: SelectOption[]
  titleError?: string
  titleId: string
}

export function EventFormDetailsSection({
  uid,
  eventTypeOptions,
  titleError,
  titleId,
}: EventFormDetailsSectionProps) {
  const form = useEventForm()
  const titleErrorId = `${titleId}-error`

  return (
    <FormSection number="01" title="Om arrangementet">
      <FieldGroup error={titleError} errorId={titleErrorId}>
        <Label htmlFor={titleId}>Tittel *</Label>
        <form.Field name="title">
          {(field: AnyFieldApi) => (
            <Input
              aria-describedby={titleError ? titleErrorId : undefined}
              aria-invalid={!!titleError}
              autoComplete="off"
              id={titleId}
              onChange={event => field.handleChange(event.target.value)}
              placeholder="Navn på arrangementet"
              required
              value={field.state.value as string}
            />
          )}
        </form.Field>
      </FieldGroup>

      <FieldGroup>
        <Label htmlFor={`${uid}-description`}>Beskrivelse</Label>
        <FieldHint>
          Fortell gjerne om hva som skjer, hvem som opptrer, og hva folk kan
          vente seg.
        </FieldHint>
        <form.Field name="description">
          {(field: AnyFieldApi) => (
            <Textarea
              className="resize-y"
              id={`${uid}-description`}
              onChange={event => field.handleChange(event.target.value)}
              placeholder="Beskriv arrangementet..."
              rows={5}
              value={field.state.value as string}
            />
          )}
        </form.Field>
      </FieldGroup>

      <form.Field name="eventTypeId">
        {(field: AnyFieldApi) => (
          <SelectField
            id={`${uid}-eventType`}
            label="Arrangementstype"
            onChange={field.handleChange}
            options={eventTypeOptions}
            placeholder="Velg type (valgfritt)"
            value={field.state.value as string}
          />
        )}
      </form.Field>

      <form.Field name="isInternalEvent">
        {(field: AnyFieldApi) => (
          <CheckboxField
            checked={field.state.value as boolean}
            hint="Arrangementet er kun tilgjengelig for frivillige."
            label="Internarrangement"
            onChange={field.handleChange}
          />
        )}
      </form.Field>
    </FormSection>
  )
}
