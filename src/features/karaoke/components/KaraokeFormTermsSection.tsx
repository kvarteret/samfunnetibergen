"use client"

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
  const values = form.state.values
  const priceType = values.priceType as PriceType
  const acceptTermsErrorId = `${acceptTermsId}-error`
  const studentProofErrorId = `${studentProofId}-error`

  return (
    <section className="space-y-4">
      <SectionHeader number="04" title="Vilkår" />
      <div className="space-y-2">
        <CheckboxField
          aria-describedby={acceptTermsError ? acceptTermsErrorId : undefined}
          aria-invalid={!!acceptTermsError}
          checked={values.acceptTerms}
          id={acceptTermsId}
          onChange={v => form.setFieldValue("acceptTerms", v)}
        >
          <span className="text-body text-foreground-muted">
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
        {acceptTermsError && (
          <FieldError id={acceptTermsErrorId}>{acceptTermsError}</FieldError>
        )}
      </div>
      {priceType === "student" && (
        <div className="space-y-2">
          <CheckboxField
            aria-describedby={
              studentProofError ? studentProofErrorId : undefined
            }
            aria-invalid={!!studentProofError}
            checked={values.studentProofAccepted}
            id={studentProofId}
            onChange={v => form.setFieldValue("studentProofAccepted", v)}
          >
            <span className="text-body text-foreground-muted">
              Jeg lover å ta med studentbevis 🤞
            </span>
          </CheckboxField>
          {studentProofError && (
            <FieldError id={studentProofErrorId}>
              {studentProofError}
            </FieldError>
          )}
        </div>
      )}
    </section>
  )
}
