"use client"

import type { AnyFieldApi } from "@tanstack/react-form"
import { type UIEvent, useState } from "react"
import { CheckboxField } from "@/components/ui/checkbox-field"
import { FieldError } from "@/components/ui/field-error"
import { FormSection } from "@/components/ui/form-section"
import { useBookingForm } from "./bookingFormContext"

const TERMS_URL = "https://kvarteret.no/leie-av-lokaler/"
const CANCELLATION_URL = "https://kvarteret.no/avbestillingsvilkar/"

interface BookingFormTermsSectionProps {
  acceptTermsError?: string
  acceptTermsId: string
}

export function BookingFormTermsSection({
  acceptTermsError,
  acceptTermsId,
}: BookingFormTermsSectionProps) {
  const form = useBookingForm()
  const [hasRead, setHasRead] = useState(false)
  const acceptTermsErrorId = `${acceptTermsId}-error`

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) setHasRead(true)
  }

  return (
    <FormSection number="08" title="Vilkår">
      <div
        className="max-w-3xl space-y-3 overflow-y-auto panel p-4 text-body"
        onScroll={handleScroll}
        style={{ maxHeight: "12rem" }}
      >
        <p>
          Ved å booke et lokale på Det Akademiske Kvarter inngår du en
          forespørsel som må godkjennes av en romkoordinator. En booking er ikke
          bekreftet før du har mottatt bekreftelse på e-post.
        </p>
        <p>
          Ekstratjenester som teknikere, catering og bar kommer som betalte
          tillegg og avtales i etterkant. Eksterne arrangører faktureres etter
          gjeldende priser.
        </p>
        <p>
          Avbestilling må skje i henhold til våre avbestillingsvilkår. Sen
          avbestilling kan medføre gebyr.
        </p>
        <p className="flex flex-wrap gap-4">
          <a
            className="font-heading underline underline-offset-4 focus-brutal"
            href={TERMS_URL}
            rel="noreferrer"
            target="_blank"
          >
            Vilkår for leie
          </a>
          <a
            className="font-heading underline underline-offset-4 focus-brutal"
            href={CANCELLATION_URL}
            rel="noreferrer"
            target="_blank"
          >
            Avbestillingsvilkår
          </a>
        </p>
        <p className="text-xs text-foreground-faint">
          Bla til bunnen for å bekrefte.
        </p>
      </div>
      <form.Field name="acceptTerms">
        {(field: AnyFieldApi) => (
          <div className="max-w-3xl space-y-2">
            <CheckboxField
              aria-describedby={
                acceptTermsError ? acceptTermsErrorId : undefined
              }
              aria-invalid={!!acceptTermsError}
              checked={field.state.value as boolean}
              disabled={!hasRead}
              id={acceptTermsId}
              label="Jeg har lest, forstått og godkjenner Det Akademiske Kvarters bookingvilkår."
              labelClassName="font-sans font-base text-foreground-muted"
              onChange={value => hasRead && field.handleChange(value)}
            />
            {acceptTermsError && (
              <FieldError id={acceptTermsErrorId}>
                {acceptTermsError}
              </FieldError>
            )}
          </div>
        )}
      </form.Field>
    </FormSection>
  )
}
