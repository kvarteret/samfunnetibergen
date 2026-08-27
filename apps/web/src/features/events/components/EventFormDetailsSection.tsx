"use client"

import { useStore, type AnyFieldApi } from "@tanstack/react-form"
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
  descriptionEnglishError?: string
  descriptionError?: string
  titleError?: string
  titleEnglishError?: string
  titleId: string
  number?: string
}

export function EventFormDetailsSection({
  uid,
  eventTypeOptions,
  descriptionEnglishError,
  descriptionError,
  titleError,
  titleEnglishError,
  titleId,
  number = "01",
}: EventFormDetailsSectionProps) {
  const form = useEventForm()
  const titleErrorId = `${titleId}-error`
  const titleEnglishId = `${uid}-title-en`
  const titleEnglishErrorId = `${titleEnglishId}-error`
  const descriptionId = `${uid}-description`
  const descriptionErrorId = `${descriptionId}-error`
  const descriptionEnglishId = `${uid}-description-en`
  const descriptionEnglishErrorId = `${descriptionEnglishId}-error`
  const hasDescription = useStore(
    form.store,
    state => state.values.description.trim().length > 0,
  )

  return (
    <FormSection number={number} title="Om arrangementet">
      <FieldGroup error={titleError} errorId={titleErrorId}>
        <Label htmlFor={titleId}>Tittel på norsk *</Label>
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

      <FieldGroup error={titleEnglishError} errorId={titleEnglishErrorId}>
        <Label htmlFor={titleEnglishId}>Tittel på engelsk *</Label>
        <FieldHint>Skriv inn den engelske oversettelsen.</FieldHint>
        <form.Field name="titleEnglish">
          {(field: AnyFieldApi) => (
            <Input
              aria-describedby={
                titleEnglishError ? titleEnglishErrorId : undefined
              }
              aria-invalid={!!titleEnglishError}
              autoComplete="off"
              id={titleEnglishId}
              onChange={event => field.handleChange(event.target.value)}
              placeholder="Name of the event"
              required
              value={field.state.value as string}
            />
          )}
        </form.Field>
      </FieldGroup>

      <FieldGroup error={descriptionError} errorId={descriptionErrorId}>
        <Label htmlFor={descriptionId}>Beskrivelse på norsk</Label>
        <FieldHint>
          Fortell gjerne om hva som skjer, hvem som opptrer, og hva folk kan
          vente seg.
        </FieldHint>
        <form.Field name="description">
          {(field: AnyFieldApi) => (
            <Textarea
              aria-describedby={
                descriptionError ? descriptionErrorId : undefined
              }
              aria-invalid={!!descriptionError}
              className="resize-y"
              id={descriptionId}
              onChange={event => field.handleChange(event.target.value)}
              placeholder="Beskriv arrangementet..."
              rows={5}
              value={field.state.value as string}
            />
          )}
        </form.Field>
      </FieldGroup>

      <FieldGroup
        error={descriptionEnglishError}
        errorId={descriptionEnglishErrorId}
      >
        <Label htmlFor={descriptionEnglishId}>Beskrivelse på engelsk</Label>
        <FieldHint>Påkrevd hvis du fyller ut en norsk beskrivelse.</FieldHint>
        <form.Field name="descriptionEnglish">
          {(field: AnyFieldApi) => (
            <Textarea
              aria-describedby={
                descriptionEnglishError ? descriptionEnglishErrorId : undefined
              }
              aria-invalid={!!descriptionEnglishError}
              className="resize-y"
              id={descriptionEnglishId}
              onChange={event => field.handleChange(event.target.value)}
              required={hasDescription}
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
