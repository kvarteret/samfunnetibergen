"use client";

import {
  FieldGroup,
  SectionHeader,
  SelectField,
} from "@/components/ui/form-fields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BookingFormState, SetBookingField } from "../domain/formState";
import { BookingTextarea } from "./BookingPrimitives";

const OPEN_CLOSED_OPTIONS = [
  { value: "Åpent", label: "Åpent arrangement" },
  { value: "Lukket", label: "Lukket arrangement" },
];

interface BookingEventDetailsSectionProps {
  state: BookingFormState;
  setField: SetBookingField;
  uid: string;
}

export function BookingEventDetailsSection({
  state,
  setField,
  uid,
}: BookingEventDetailsSectionProps) {
  return (
    <section className="space-y-6">
      <SectionHeader number="03" title="Arrangement" />
      <div className="grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldGroup className="sm:col-span-2">
          <Label htmlFor={`${uid}-eventName`}>Navn på arrangement *</Label>
          <Input
            autoComplete="off"
            id={`${uid}-eventName`}
            onChange={(e) => setField("eventName")(e.target.value)}
            placeholder="F.eks. konsert, møte, foredrag"
            value={state.eventName}
          />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor={`${uid}-audience`}>Estimert antall publikum *</Label>
          <Input
            id={`${uid}-audience`}
            min={0}
            onChange={(e) => setField("audienceCount")(e.target.value)}
            placeholder="F.eks. 50"
            type="number"
            value={state.audienceCount}
          />
        </FieldGroup>
        <SelectField
          id={`${uid}-openClosed`}
          label="Åpent / lukket *"
          onChange={(value) =>
            setField("openOrClosed")(value as BookingFormState["openOrClosed"])
          }
          options={OPEN_CLOSED_OPTIONS}
          value={state.openOrClosed}
        />
        <FieldGroup className="sm:col-span-2">
          <Label htmlFor={`${uid}-description`}>Beskrivelse</Label>
          <BookingTextarea
            id={`${uid}-description`}
            onChange={setField("description")}
            placeholder="Fortell oss kort om arrangementet ditt..."
            value={state.description}
          />
        </FieldGroup>
      </div>
    </section>
  );
}
