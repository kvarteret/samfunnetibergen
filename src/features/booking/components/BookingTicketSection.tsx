"use client";

import {
  FieldGroup,
  SectionHeader,
  SelectField,
} from "@/components/ui/form-fields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BookingFormState, SetBookingField } from "../domain/formState";

const FREE_PAID_OPTIONS = [
  { value: "Gratis", label: "Gratis" },
  { value: "Betalt", label: "Betalt" },
];

interface BookingTicketSectionProps {
  state: BookingFormState;
  setField: SetBookingField;
  uid: string;
}

export function BookingTicketSection({
  state,
  setField,
  uid,
}: BookingTicketSectionProps) {
  return (
    <section className="space-y-6">
      <SectionHeader number="06" title="Billett" />
      <div className="grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField
          id={`${uid}-freePaid`}
          label="Gratis / betalt *"
          onChange={(value) =>
            setField("freeOrPaid")(value as BookingFormState["freeOrPaid"])
          }
          options={FREE_PAID_OPTIONS}
          value={state.freeOrPaid}
        />
        {state.freeOrPaid === "Betalt" && (
          <FieldGroup>
            <Label htmlFor={`${uid}-tickets`}>Billettyper og priser</Label>
            <Input
              id={`${uid}-tickets`}
              onChange={(e) => setField("ticketTypes")(e.target.value)}
              placeholder="F.eks. Ordinær 150 kr, student 100 kr"
              value={state.ticketTypes}
            />
          </FieldGroup>
        )}
      </div>
    </section>
  );
}
