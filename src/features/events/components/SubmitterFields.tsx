"use client";

import { FieldGroup, SectionHeader } from "@/components/ui/form-fields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SetFormField } from "../domain/formState";

interface SubmitterFieldsProps {
  uid: string;
  submittedBy: string;
  submittedByEmail: string;
  submittedByOrganization: string;
  setField: SetFormField;
}

export function SubmitterFields({
  uid,
  submittedBy,
  submittedByEmail,
  submittedByOrganization,
  setField,
}: SubmitterFieldsProps) {
  return (
    <section className="space-y-6">
      <SectionHeader number="08" title="Kontaktinformasjon" />

      <p className="text-sm leading-6 text-foreground/60">
        Vi trenger en kontaktperson for arrangementet. Informasjonen vises ikke
        offentlig - den brukes bare av Kvarterets PR-gruppe til å følge opp
        innmeldingen.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldGroup>
          <Label htmlFor={`${uid}-submittedBy`}>Ditt navn *</Label>
          <Input
            autoComplete="name"
            id={`${uid}-submittedBy`}
            onChange={(event) => setField("submittedBy")(event.target.value)}
            placeholder="Fullt navn"
            required
            value={submittedBy}
          />
        </FieldGroup>

        <FieldGroup>
          <Label htmlFor={`${uid}-submittedByEmail`}>
            E-postadresse *
          </Label>
          <Input
            autoComplete="email"
            id={`${uid}-submittedByEmail`}
            onChange={(event) =>
              setField("submittedByEmail")(event.target.value)
            }
            placeholder="epost@eksempel.no"
            required
            type="email"
            value={submittedByEmail}
          />
        </FieldGroup>
      </div>

      <FieldGroup>
        <Label htmlFor={`${uid}-org`}>Organisasjon / gruppe</Label>
        <Input
          id={`${uid}-org`}
          onChange={(event) =>
            setField("submittedByOrganization")(event.target.value)
          }
          placeholder="F.eks. Bandet Skumringen, Realfagskollegiet"
          value={submittedByOrganization}
        />
      </FieldGroup>
    </section>
  );
}
