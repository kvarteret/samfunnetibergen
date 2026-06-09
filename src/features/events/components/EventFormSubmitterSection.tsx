"use client"

import { FieldGroup, SectionHeader } from "@/components/ui/form-fields"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEventForm } from "./eventFormContext"

interface EventFormSubmitterSectionProps {
  uid: string
}

export function EventFormSubmitterSection({
  uid,
}: EventFormSubmitterSectionProps) {
  const form = useEventForm()

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
            onChange={event =>
              form.setFieldValue("submittedBy", event.target.value)
            }
            placeholder="Fullt navn"
            required
            value={form.state.values.submittedBy}
          />
        </FieldGroup>

        <FieldGroup>
          <Label htmlFor={`${uid}-submittedByEmail`}>E-postadresse *</Label>
          <Input
            autoComplete="email"
            id={`${uid}-submittedByEmail`}
            onChange={event =>
              form.setFieldValue("submittedByEmail", event.target.value)
            }
            placeholder="epost@eksempel.no"
            required
            type="email"
            value={form.state.values.submittedByEmail}
          />
        </FieldGroup>
      </div>

      <FieldGroup>
        <Label htmlFor={`${uid}-org`}>Organisasjon / gruppe</Label>
        <Input
          id={`${uid}-org`}
          onChange={event =>
            form.setFieldValue("submittedByOrganization", event.target.value)
          }
          placeholder="F.eks. Bandet Skumringen, Realfagskollegiet"
          value={form.state.values.submittedByOrganization}
        />
      </FieldGroup>
    </section>
  )
}
