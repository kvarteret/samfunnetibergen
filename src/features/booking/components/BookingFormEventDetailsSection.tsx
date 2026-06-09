"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useId } from "react";
import { FieldGroup, SectionHeader, SelectField } from "@/components/ui/form-fields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookingTextarea } from "./BookingFormPrimitives";
import { useBookingForm } from "./bookingFormContext";

const OPEN_CLOSED_OPTIONS = [{ value: "Åpent", label: "Åpent arrangement" }, { value: "Lukket", label: "Lukket arrangement" }];

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface Props {}

export function BookingFormEventDetailsSection({ }: Props) {
  const uid = useId();
  const form = useBookingForm();
  return (
    <section className="space-y-6">
      <SectionHeader number="03" title="Arrangement" />
      <div className="grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldGroup className="sm:col-span-2">
          <Label htmlFor={`${uid}-eventName`}>Navn på arrangement *</Label>
          <form.Field name="eventName">
            {(field: any) => (
              <Input
                autoComplete="off"
                id={`${uid}-eventName`}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="F.eks. konsert, møte, foredrag"
                value={field.state.value as string}
              />
            )}
          </form.Field>
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor={`${uid}-audience`}>Estimert antall publikum *</Label>
          <form.Field name="audienceCount">
            {(field: any) => (
              <Input id={`${uid}-audience`} min={0} onChange={(e) => field.handleChange(e.target.value)} placeholder="F.eks. 50" type="number" value={field.state.value as string} />
            )}
          </form.Field>
        </FieldGroup>
        <form.Field name="openOrClosed">
          {(field: any) => (
            <SelectField id={`${uid}-openClosed`} label="Åpent / lukket *" onChange={field.handleChange} options={OPEN_CLOSED_OPTIONS} value={field.state.value as string} />
          )}
        </form.Field>
        <FieldGroup className="sm:col-span-2">
          <Label htmlFor={`${uid}-description`}>Beskrivelse</Label>
          <BookingTextarea
            id={`${uid}-description`}
            onChange={(v) => form.setFieldValue("description", v)}
            placeholder="Fortell oss kort om arrangementet ditt..."
            value={form.state.values.description}
          />
        </FieldGroup>
      </div>
    </section>
  );
}
