"use client";

import {
  CheckboxSquare,
  FieldGroup,
  FieldHint,
  SectionHeader,
  SelectField,
  type SelectOption,
} from "@/components/ui/form-fields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEventForm } from "./eventFormContext";

interface EventFormDetailsSectionProps {
  uid: string;
  eventTypeOptions: SelectOption[];
}

export function EventFormDetailsSection({
  uid,
  eventTypeOptions,
}: EventFormDetailsSectionProps) {
  const form = useEventForm();
  const values = form.state.values;

  return (
    <section className="space-y-6">
      <SectionHeader number="01" title="Om arrangementet" />

      <FieldGroup>
        <Label htmlFor={`${uid}-title`}>Tittel *</Label>
        <Input
          autoComplete="off"
          id={`${uid}-title`}
          onChange={(event) =>
            form.setFieldValue("title", event.target.value)
          }
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
        <textarea
          className="w-full resize-y border-2 border-border bg-background px-3 py-2 text-sm font-base text-foreground placeholder:text-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          id={`${uid}-description`}
          onChange={(event) =>
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
        onChange={(v) => form.setFieldValue("eventTypeId", v)}
        options={eventTypeOptions}
        placeholder="Velg type (valgfritt)"
        value={values.eventTypeId}
      />

      <label className="group flex cursor-pointer items-start gap-3">
        <CheckboxSquare
          checked={values.isInternalEvent}
          onChange={(v) => form.setFieldValue("isInternalEvent", v)}
        />
        <span>
          <span className="block font-heading text-sm text-foreground">
            Internarrangement
          </span>
          <span className="mt-0.5 block text-xs text-foreground/55">
            Arrangementet er kun tilgjengelig for frivillige.
          </span>
        </span>
      </label>
    </section>
  );
}
