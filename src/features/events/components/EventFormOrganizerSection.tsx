"use client";

import {
  FieldGroup,
  FieldHint,
  SectionHeader,
  SelectField,
  type SelectOption,
} from "@/components/ui/form-fields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEventForm } from "./eventFormContext";

interface EventOrganizerFieldsProps {
  uid: string;
  groupOptions: SelectOption[];
}

export function EventFormOrganizerSection({
  uid,
  groupOptions,
}: EventOrganizerFieldsProps) {
  const form = useEventForm();
  const values = form.state.values;

  return (
    <section className="space-y-6">
      <SectionHeader number="05" title="Arrangør" />

      <SelectField
        hint="Om din gruppe er registrert på Kvarteret, velg den her."
        id={`${uid}-organizerGroup`}
        label="Gruppe på Kvarteret"
        onChange={(v) => form.setFieldValue("organizerGroup", v)}
        options={groupOptions}
        placeholder="Velg gruppe (valgfritt)"
        value={values.organizerGroup}
      />

      <FieldGroup>
        <Label htmlFor={`${uid}-organizerText`}>
          Arrangørnavn (fritekst)
        </Label>
        <FieldHint>
          Bruk dette om dere ikke er i lista - f.eks. &quot;Bandet
          Skumringen&quot;, &quot;Fagutvalget ved MN&quot;.
        </FieldHint>
        <Input
          id={`${uid}-organizerText`}
          onChange={(event) =>
            form.setFieldValue("organizerText", event.target.value)
          }
          placeholder="Arrangørens navn"
          value={values.organizerText}
        />
      </FieldGroup>
    </section>
  );
}
