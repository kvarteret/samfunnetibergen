"use client";

import { FieldGroup, SectionHeader } from "@/components/ui/form-fields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SetFormField } from "../domain/formState";

interface EventLinksFieldsProps {
  uid: string;
  ticketUrl: string;
  facebookUrl: string;
  setField: SetFormField;
}

export function EventLinksFields({
  uid,
  ticketUrl,
  facebookUrl,
  setField,
}: EventLinksFieldsProps) {
  return (
    <section className="space-y-6">
      <SectionHeader number="07" title="Lenker" />

      <FieldGroup>
        <Label htmlFor={`${uid}-ticketUrl`}>Billettlenke</Label>
        <Input
          id={`${uid}-ticketUrl`}
          onChange={(event) => setField("ticketUrl")(event.target.value)}
          placeholder="https://ticketmaster.no/..."
          type="url"
          value={ticketUrl}
        />
      </FieldGroup>

      <FieldGroup>
        <Label htmlFor={`${uid}-facebookUrl`}>Facebook-arrangement</Label>
        <Input
          id={`${uid}-facebookUrl`}
          onChange={(event) => setField("facebookUrl")(event.target.value)}
          placeholder="https://facebook.com/events/..."
          type="url"
          value={facebookUrl}
        />
      </FieldGroup>
    </section>
  );
}
