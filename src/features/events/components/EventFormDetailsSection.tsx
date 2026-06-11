"use client"

import { CheckboxField } from "@/components/ui/checkbox-field"
import { FieldGroup, FieldHint } from "@/components/ui/field-group"
import { FormSection } from "@/components/ui/form-section"
import { SelectField, type SelectOption } from "@/components/ui/select-field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  const values = form.state.values
  const titleErrorId = `${titleId}-error`

  return (
    <FormSection number="01" title="Om arrangementet">
      <FieldGroup error={titleError} errorId={titleErrorId}>
        <Label htmlFor={titleId}>Tittel *</Label>
        <Input
          aria-describedby={titleError ? titleErrorId : undefined}
          aria-invalid={!!titleError}
          autoComplete="off"
          id={titleId}
          onChange={event => form.setFieldValue("title", event.target.value)}
          placeholder="Navn på arrangementet"
          required
          value={values.title}
        />
      </FieldGroup>

      <FieldGroup>
        <Label htmlFor={`${uid}-description`}>Beskrivelse</Label>
        <FieldHint>
          Fortell gjerne om hva som skjer, hvem som opptrer, og hva folk kan
          vente seg.
        </FieldHint>
        <Textarea
          className="resize-y"
          id={`${uid}-description`}
          onChange={event =>
            form.setFieldValue("description", event.target.value)
          }
          placeholder="Beskriv arrangementet..."
          rows={5}
          value={values.description}
        />
      </FieldGroup>

      <SelectField
        id={`${uid}-eventType`}
        label="Arrangementstype"
        onChange={v => form.setFieldValue("eventTypeId", v)}
        options={eventTypeOptions}
        placeholder="Velg type (valgfritt)"
        value={values.eventTypeId}
      />

      <CheckboxField
        checked={values.isInternalEvent}
        hint="Arrangementet er kun tilgjengelig for frivillige."
        label="Internarrangement"
        onChange={v => form.setFieldValue("isInternalEvent", v)}
      />
    </FormSection>
  )
}
