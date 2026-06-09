"use client";

import {
  FieldGroup,
  SectionHeader,
} from "@/components/ui/form-fields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useKaraokeForm } from "./karaokeFormContext";

interface KaraokeContactSectionProps {
  uid: string;
}

export function KaraokeContactSection({
  uid,
}: KaraokeContactSectionProps) {
  const form = useKaraokeForm();

  return (
    <section className="space-y-6">
      <SectionHeader number="03" title="Kontaktinformasjon" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldGroup>
          <Label htmlFor={`${uid}-contactName`}>Navn *</Label>
          <Input
            autoComplete="name"
            id={`${uid}-contactName`}
            onChange={(event) =>
              form.setFieldValue("contactName", event.target.value)
            }
            placeholder="Fullt navn"
            required
            value={form.state.values.contactName}
          />
        </FieldGroup>

        <FieldGroup>
          <Label htmlFor={`${uid}-contactEmail`}>E-post *</Label>
          <Input
            autoComplete="email"
            id={`${uid}-contactEmail`}
            onChange={(event) =>
              form.setFieldValue("contactEmail", event.target.value)
            }
            placeholder="din@epost.no"
            required
            type="email"
            value={form.state.values.contactEmail}
          />
        </FieldGroup>
      </div>

      <FieldGroup>
        <Label htmlFor={`${uid}-contactPhone`}>Telefon</Label>
        <Input
          autoComplete="tel"
          id={`${uid}-contactPhone`}
          onChange={(event) =>
            form.setFieldValue("contactPhone", event.target.value)
          }
          placeholder="+47 55 55 55 55"
          type="tel"
          value={form.state.values.contactPhone}
        />
      </FieldGroup>
    </section>
  );
}
