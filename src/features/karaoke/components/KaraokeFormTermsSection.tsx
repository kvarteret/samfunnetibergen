"use client"

import type { AnyFieldApi } from "@tanstack/react-form"
import { CheckboxField } from "@/components/ui/checkbox-field"
import { FieldError } from "@/components/ui/field-error"
import { SectionHeader } from "@/components/ui/section-header"
import { Link } from "@/i18n/navigation"
import type { PriceType } from "../types"
import { useKaraokeForm } from "./karaokeFormContext"

interface KaraokeFormTermsSectionProps {
  acceptTermsError?: string
  acceptTermsId: string
  studentProofError?: string
  studentProofId: string
}

export function KaraokeFormTermsSection({
  acceptTermsError,
  acceptTermsId,
  studentProofError,
  studentProofId,
}: KaraokeFormTermsSectionProps) {
  const form = useKaraokeForm()
  const acceptTermsErrorId = `${acceptTermsId}-error`
  const studentProofErrorId = `${studentProofId}-error`

  return (
    <section className="space-y-4">
      <SectionHeader number="04" title="Vilkår" />
      <div className="space-y-2">
        <form.Field name="acceptTerms">
          {(field: AnyFieldApi) => (
            <CheckboxField
              aria-describedby={
                acceptTermsError ? acceptTermsErrorId : undefined
              }
              aria-invalid={!!acceptTermsError}
              checked={field.state.value as boolean}
              id={acceptTermsId}
              onChange={field.handleChange}
            >
              <span>
                Ved å krysse av denne boksen aksepterer jeg at jeg har lest,
                forstått og godkjenner{" "}
                <Link
                  className="underline underline-offset-2 hover:text-foreground transition-colors focus-brutal"
                  href="/vilkar-for-leie-av-karaoke"
                >
                  bruksvilkårene
                </Link>
                .
              </span>
            </CheckboxField>
          )}
        </form.Field>
        {acceptTermsError && (
          <FieldError id={acceptTermsErrorId}>{acceptTermsError}</FieldError>
        )}
      </div>
      <form.Field name="priceType">
        {(priceTypeField: AnyFieldApi) =>
          (priceTypeField.state.value as PriceType) === "student" ? (
            <div className="space-y-2">
              <form.Field name="studentProofAccepted">
                {(field: AnyFieldApi) => (
                  <CheckboxField
                    aria-describedby={
                      studentProofError ? studentProofErrorId : undefined
                    }
                    aria-invalid={!!studentProofError}
                    checked={field.state.value as boolean}
                    id={studentProofId}
                    onChange={field.handleChange}
                  >
                    <span>Jeg lover å ta med studentbevis 🤞</span>
                  </CheckboxField>
                )}
              </form.Field>
              {studentProofError && (
                <FieldError id={studentProofErrorId}>
                  {studentProofError}
                </FieldError>
              )}
            </div>
          ) : null
        }
      </form.Field>
    </section>
  )
}
