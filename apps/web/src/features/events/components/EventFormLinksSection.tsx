"use client"

import { type AnyFieldApi, useStore } from "@tanstack/react-form"
import { CheckboxField } from "@/components/ui/checkbox-field"
import { FieldGroup, FieldHint } from "@/components/ui/field-group"
import { FormSection } from "@/components/ui/form-section"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEventForm } from "./eventFormContext"

interface EventFormLinksSectionProps {
  uid: string
  priceError?: string
  ticketUrlError?: string
  number?: string
}

const PRICE_FIELDS = [
  ["priceOrdinar", "Ordinær"],
  ["priceStudent", "Student"],
  ["priceMedlem", "Medlem"],
] as const

export function EventFormLinksSection({
  uid,
  priceError,
  ticketUrlError,
  number = "06",
}: EventFormLinksSectionProps) {
  const form = useEventForm()
  const isFree = useStore(form.store, state => state.values.isFree)
  const priceErrorId = `${uid}-priceOrdinar-error`
  const ticketUrlId = `${uid}-ticketUrl`
  const ticketUrlErrorId = `${ticketUrlId}-error`

  return (
    <FormSection number={number} title="Pris og lenker">
      <form.Field name="isFree">
        {(field: AnyFieldApi) => (
          <CheckboxField
            checked={field.state.value as boolean}
            hint="Gratis arrangementer trenger verken pris eller billettlenke."
            label="Gratis inngang"
            onChange={field.handleChange}
          />
        )}
      </form.Field>

      {!isFree && (
        <FieldGroup error={priceError} errorId={priceErrorId}>
          <Label htmlFor={`${uid}-priceOrdinar`}>Pris *</Label>
          <FieldHint>
            Pris i kroner. Fyll ut minst én, og la resten stå tomme om de ikke
            gjelder.
          </FieldHint>
          <div className="grid gap-4 sm:grid-cols-3">
            {PRICE_FIELDS.map(([name, label]) => (
              <div className="space-y-2" key={name}>
                <Label htmlFor={`${uid}-${name}`}>{label}</Label>
                <form.Field name={name}>
                  {(field: AnyFieldApi) => (
                    <Input
                      aria-describedby={priceError ? priceErrorId : undefined}
                      aria-invalid={!!priceError}
                      id={`${uid}-${name}`}
                      inputMode="numeric"
                      min={0}
                      onChange={event => field.handleChange(event.target.value)}
                      placeholder="kr"
                      type="number"
                      value={field.state.value as string}
                    />
                  )}
                </form.Field>
              </div>
            ))}
          </div>
        </FieldGroup>
      )}

      <FieldGroup error={ticketUrlError} errorId={ticketUrlErrorId}>
        <Label htmlFor={ticketUrlId}>Billettlenke{isFree ? "" : " *"}</Label>
        <form.Field name="ticketUrl">
          {(field: AnyFieldApi) => (
            <Input
              aria-describedby={ticketUrlError ? ticketUrlErrorId : undefined}
              aria-invalid={!!ticketUrlError}
              autoComplete="url"
              id={ticketUrlId}
              inputMode="url"
              onChange={event => field.handleChange(event.target.value)}
              placeholder="https://ticketco.events/..."
              required={!isFree}
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
