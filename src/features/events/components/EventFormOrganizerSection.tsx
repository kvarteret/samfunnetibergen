"use client"

import { FieldGroup, FieldHint } from "@/components/ui/field-group"
import { FormSection } from "@/components/ui/form-section"
import { SelectField, type SelectOption } from "@/components/ui/select-field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEventForm } from "./eventFormContext"

interface EventFormOrganizerSectionProps {
  uid: string
  groupOptions: SelectOption[]
}

export function EventFormOrganizerSection({
  uid,
  groupOptions,
}: EventFormOrganizerSectionProps) {
  const form = useEventForm()
  const values = form.state.values

  return (
    <FormSection number="05" title="Arrangør">
      <SelectField
        hint="Om din gruppe er registrert på Kvarteret, velg den her."
        id={`${uid}-organizerGroup`}
        label="Gruppe på Kvarteret"
        onChange={v => form.setFieldValue("organizerGroup", v)}
        options={groupOptions}
        placeholder="Velg gruppe (valgfritt)"
        value={values.organizerGroup}
      />

      <FieldGroup>
        <Label htmlFor={`${uid}-organizerText`}>Arrangørnavn (fritekst)</Label>
        <FieldHint>
          Bruk dette om dere ikke er i lista - f.eks. &quot;Bandet
          Skumringen&quot;, &quot;Fagutvalget ved MN&quot;.
        </FieldHint>
        <Input
          id={`${uid}-organizerText`}
          onChange={event =>
            form.setFieldValue("organizerText", event.target.value)
          }
          placeholder="Arrangørens navn"
          value={values.organizerText}
        />
      </FieldGroup>
    </FormSection>
  )
}
