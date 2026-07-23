"use client"

import type { AnyFieldApi } from "@tanstack/react-form"
import { FieldGroup, FieldHint } from "@/components/ui/field-group"
import { FormSection } from "@/components/ui/form-section"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SelectField, type SelectOption } from "@/components/ui/select-field"
import { useEventForm } from "./eventFormContext"

interface EventFormPlaceSectionProps {
  uid: string
  roomOptions: SelectOption[]
  number?: string
}

export function EventFormPlaceSection({
  uid,
  roomOptions,
  number = "04",
}: EventFormPlaceSectionProps) {
  const form = useEventForm()

  return (
    <FormSection number={number} title="Sted">
      <form.Field name="room">
        {(field: AnyFieldApi) => (
          <SelectField
            hint="Velg rommet om arrangementet er i et av Kvarterets lokaler."
            id={`${uid}-room`}
            label="Rom på Kvarteret"
            onChange={field.handleChange}
            options={roomOptions}
            placeholder="Velg rom (valgfritt)"
            value={field.state.value as string}
          />
        )}
      </form.Field>

      <FieldGroup>
        <Label htmlFor={`${uid}-roomText`}>Alternativt sted</Label>
        <FieldHint>
          Bruk dette feltet om stedet ikke er i lista, f.eks.
          &quot;Uteområdet&quot; eller &quot;Storstuen, 3. etasje&quot;. For
          arrangementer utenfor Kvarteret, ta med full gateadresse.
        </FieldHint>
        <form.Field name="roomText">
          {(field: AnyFieldApi) => (
            <Input
              id={`${uid}-roomText`}
              onChange={event => field.handleChange(event.target.value)}
              placeholder="Stedsnavn, og gateadresse utenfor Kvarteret"
              value={field.state.value as string}
            />
          )}
        </form.Field>
      </FieldGroup>
    </FormSection>
  )
}
