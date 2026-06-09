"use client";

import { FieldGroup, SectionHeader } from "@/components/ui/form-fields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSubmitEventForm } from "./submitEventFormContext";

interface EventLinksFieldsProps {
  uid: string;
}

export function EventLinksFields({ uid }: EventLinksFieldsProps) {
  const form = useSubmitEventForm();

  return (
    <section className="space-y-6">
      <SectionHeader number="07" title="Lenker" />

      <FieldGroup>
        <Label htmlFor={`${uid}-ticketUrl`}>Billettlenke</Label>
        <Input
          id={`${uid}-ticketUrl`}
          onChange={(event) =>
            form.setFieldValue("ticketUrl", event.target.value)
          }
          placeholder="https://ticketmaster.no/..."
          type="url"
          value={form.state.values.ticketUrl}
        />
      </FieldGroup>

      <FieldGroup>
        <Label htmlFor={`${uid}-facebookUrl`}>
          Facebook-arrangement
        </Label>
        <Input
          id={`${uid}-facebookUrl`}
          onChange={(event) =>
            form.setFieldValue("facebookUrl", event.target.value)
          }
          placeholder="https://facebook.com/events/..."
          type="url"
          value={form.state.values.facebookUrl}
        />
      </FieldGroup>
    </section>
  );
}
