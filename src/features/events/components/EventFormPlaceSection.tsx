"use client"

import { FieldGroup, FieldHint } from "@/components/ui/field-group"
import { FormSection } from "@/components/ui/form-section"
import { SelectField, type SelectOption } from "@/components/ui/select-field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEventForm } from "./eventFormContext"

interface EventFormPlaceSectionProps {
  uid: string
  roomOptions: SelectOption[]
}

export function EventFormPlaceSection({
  uid,
  roomOptions,
}: EventFormPlaceSectionProps) {
  const form = useEventForm()
  const values = form.state.values

  return (
    <FormSection number="04" title="Sted">
      <SelectField
        hint="Velg rommet om arrangementet er i et av Kvarterets lokaler."
        id={`${uid}-room`}
        label="Rom på Kvarteret"
        onChange={v => form.setFieldValue("room", v)}
        options={roomOptions}
        placeholder="Velg rom (valgfritt)"
        value={values.room}
      />

      <FieldGroup>
        <Label htmlFor={`${uid}-roomText`}>Alternativt sted</Label>
        <FieldHint>
          Bruk dette feltet om stedet ikke er i lista, f.eks.
          &quot;Uteområdet&quot; eller &quot;Storstuen, 3. etasje&quot;.
        </FieldHint>
        <Input
          id={`${uid}-roomText`}
          onChange={event => form.setFieldValue("roomText", event.target.value)}
          placeholder="Fritekst"
          value={values.roomText}
        />
      </FieldGroup>
    </FormSection>
  )
}
