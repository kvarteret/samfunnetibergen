"use client";

import { FieldGroup, SectionHeader } from "@/components/ui/form-fields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type BookingFormState,
  isExternalBooker,
  type SetBookingField,
} from "../domain/formState";

interface BookingContactSectionProps {
  state: BookingFormState;
  setField: SetBookingField;
  uid: string;
}

export function BookingContactSection({
  state,
  setField,
  uid,
}: BookingContactSectionProps) {
  const isExternal = isExternalBooker(state.bookerType);
  return (
    <section className="space-y-6">
      <SectionHeader number="07" title="Kontaktinformasjon" />
      <div className="grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldGroup>
          <Label htmlFor={`${uid}-contactName`}>Navn *</Label>
          <Input
            autoComplete="name"
            id={`${uid}-contactName`}
            onChange={(e) => setField("contactName")(e.target.value)}
            placeholder="Fullt navn"
            value={state.contactName}
          />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor={`${uid}-contactEmail`}>E-post *</Label>
          <Input
            autoComplete="email"
            id={`${uid}-contactEmail`}
            onChange={(e) => setField("contactEmail")(e.target.value)}
            placeholder="din@epost.no"
            type="email"
            value={state.contactEmail}
          />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor={`${uid}-contactPhone`}>Telefon</Label>
          <Input
            autoComplete="tel"
            id={`${uid}-contactPhone`}
            onChange={(e) => setField("contactPhone")(e.target.value)}
            placeholder="+47 55 55 55 55"
            type="tel"
            value={state.contactPhone}
          />
        </FieldGroup>
        {isExternal && (
          <>
            <FieldGroup>
              <Label htmlFor={`${uid}-invoiceAddress`}>Fakturaadresse *</Label>
              <Input
                id={`${uid}-invoiceAddress`}
                onChange={(e) => setField("invoiceAddress")(e.target.value)}
                placeholder="Adresse for faktura"
                value={state.invoiceAddress}
              />
            </FieldGroup>
            <FieldGroup>
              <Label htmlFor={`${uid}-orgNumber`}>Org.nr.</Label>
              <Input
                id={`${uid}-orgNumber`}
                onChange={(e) => setField("orgNumber")(e.target.value)}
                placeholder="Valgfritt"
                type="number"
                value={state.orgNumber}
              />
            </FieldGroup>
          </>
        )}
      </div>
    </section>
  );
}
