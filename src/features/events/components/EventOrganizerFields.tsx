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
import type { SetFormField } from "../domain/formState";

interface EventOrganizerFieldsProps {
  uid: string;
  organizerGroup: string;
  organizerText: string;
  groupOptions: SelectOption[];
  setField: SetFormField;
}

export function EventOrganizerFields({
  uid,
  organizerGroup,
  organizerText,
  groupOptions,
  setField,
}: EventOrganizerFieldsProps) {
  return (
    <section className="space-y-6">
      <SectionHeader number="05" title="Arrangør" />

      <SelectField
        hint="Om din gruppe er registrert på Kvarteret, velg den her."
        id={`${uid}-organizerGroup`}
        label="Gruppe på Kvarteret"
        onChange={setField("organizerGroup")}
        options={groupOptions}
        placeholder="Velg gruppe (valgfritt)"
        value={organizerGroup}
      />

      <FieldGroup>
        <Label htmlFor={`${uid}-organizerText`}>Arrangørnavn (fritekst)</Label>
        <FieldHint>
          Bruk dette om dere ikke er i lista - f.eks. &quot;Bandet
          Skumringen&quot;, &quot;Fagutvalget ved MN&quot;.
        </FieldHint>
        <Input
          id={`${uid}-organizerText`}
          onChange={(event) => setField("organizerText")(event.target.value)}
          placeholder="Arrangørens navn"
          value={organizerText}
        />
      </FieldGroup>
    </section>
  );
}
