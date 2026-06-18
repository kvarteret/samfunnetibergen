"use client"

import type { AnyFieldApi } from "@tanstack/react-form"
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
  number?: string
}

export function EventFormOrganizerSection({
  uid,
  groupOptions,
  number = "05",
}: EventFormOrganizerSectionProps) {
  const form = useEventForm()

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

      <FieldGroup>
        <Label htmlFor={`${uid}-organizerText`}>Arrangørnavn (fritekst)</Label>
        <FieldHint>
          Bruk dette om dere ikke er i lista - f.eks. &quot;Bandet
          Skumringen&quot;, &quot;Fagutvalget ved MN&quot;.
        </FieldHint>
        <form.Field name="organizerText">
          {(field: AnyFieldApi) => (
            <Input
              autoComplete="organization"
              id={`${uid}-organizerText`}
              onChange={event => field.handleChange(event.target.value)}
              placeholder="Arrangørens navn"
              value={field.state.value as string}
            />
          )}
        </form.Field>
      </FieldGroup>
    </FormSection>
  )
}
