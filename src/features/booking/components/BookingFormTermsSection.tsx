"use client"

import { type UIEvent, useState } from "react"
import { CheckboxField, FormSection } from "@/components/ui/form-fields"
import { useBookingForm } from "./bookingFormContext"

const TERMS_URL = "https://kvarteret.no/leie-av-lokaler/"
const CANCELLATION_URL = "https://kvarteret.no/avbestillingsvilkar/"

export function BookingFormTermsSection() {
  const form = useBookingForm()
  const [hasRead, setHasRead] = useState(false)

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) setHasRead(true)
  }

  return (
    <FormSection number="08" title="Vilkår">
      <div
        className="max-w-3xl space-y-3 overflow-y-auto border-2 border-border bg-card p-4 text-body"
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
            className="font-heading underline underline-offset-4"
            href={TERMS_URL}
            rel="noreferrer"
            target="_blank"
          >
            Vilkår for leie
          </a>
          <a
            className="font-heading underline underline-offset-4"
            href={CANCELLATION_URL}
            rel="noreferrer"
            target="_blank"
          >
            Avbestillingsvilkår
          </a>
        </p>
        <p className="text-xs text-foreground/45">
          Bla til bunnen for å bekrefte.
        </p>
      </div>
      <form.Field name="acceptTerms">
        {(field: any) => (
          <CheckboxField
            checked={field.state.value as boolean}
            className="max-w-3xl"
            disabled={!hasRead}
            label="Jeg har lest, forstått og godkjenner Det Akademiske Kvarters bookingvilkår."
            labelClassName="font-sans font-base text-foreground/80"
            onChange={value => hasRead && field.handleChange(value)}
          />
        )}
      </form.Field>
    </FormSection>
  )
}
