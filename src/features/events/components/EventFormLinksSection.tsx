"use client"

import type { AnyFieldApi } from "@tanstack/react-form"
import { FieldGroup } from "@/components/ui/field-group"
import { FormSection } from "@/components/ui/form-section"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEventForm } from "./eventFormContext"

interface EventFormLinksSectionProps {
  uid: string
  number?: string
}

export function EventFormLinksSection({
  uid,
  number = "07",
}: EventFormLinksSectionProps) {
  const form = useEventForm()

  return (
    <FormSection number={number} title="Lenker">
      <FieldGroup>
        <Label htmlFor={`${uid}-ticketUrl`}>Billettlenke</Label>
        <form.Field name="ticketUrl">
          {(field: AnyFieldApi) => (
            <Input
              autoComplete="url"
              id={`${uid}-ticketUrl`}
              inputMode="url"
              onChange={event => field.handleChange(event.target.value)}
              placeholder="https://ticketmaster.no/..."
              type="url"
              value={field.state.value as string}
            />
          )}
        </form.Field>
      </FieldGroup>

      <FieldGroup>
        <Label htmlFor={`${uid}-facebookUrl`}>Facebook-arrangement</Label>
        <form.Field name="facebookUrl">
          {(field: AnyFieldApi) => (
            <Input
              autoComplete="url"
              id={`${uid}-facebookUrl`}
              inputMode="url"
              onChange={event => field.handleChange(event.target.value)}
              placeholder="https://facebook.com/events/..."
              type="url"
              value={field.state.value as string}
            />
          )}
        </form.Field>
      </FieldGroup>
    </FormSection>
  )
}
