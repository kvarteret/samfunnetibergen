"use client"

import type { AnyFieldApi } from "@tanstack/react-form"
import { useTranslations } from "next-intl"
import { CheckboxField } from "@/components/ui/checkbox-field"
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
  const t = useTranslations("Karaoke")

  const form = useKaraokeForm()
  const acceptTermsErrorId = `${acceptTermsId}-error`
  const studentProofErrorId = `${studentProofId}-error`

  return (
    <section className="space-y-4">
      <SectionHeader number="04" title={t("terms")} />
      <div className="space-y-2">
        <form.Field name="acceptTerms">
          {(field: AnyFieldApi) => (
            <CheckboxField
              aria-describedby={
                acceptTermsError ? acceptTermsErrorId : undefined
              }
              aria-invalid={!!acceptTermsError}
              checked={field.state.value as boolean}
              error={acceptTermsError}
              errorId={acceptTermsErrorId}
              id={acceptTermsId}
              onChange={field.handleChange}
            >
              <span>
                {t.rich("termsAccept", {
                  link: chunks => (
                    <Link
                      className="underline underline-offset-2 hover:text-foreground transition-colors focus-brutal"
                      href="/vilkar-for-leie-av-karaoke"
                    >
                      {chunks}
                    </Link>
                  ),
                })}
              </span>
            </CheckboxField>
          )}
        </form.Field>
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
                    error={studentProofError}
                    errorId={studentProofErrorId}
                    id={studentProofId}
                    onChange={field.handleChange}
                  >
                    <span>{t("studentPromise")}</span>
                  </CheckboxField>
                )}
              </form.Field>
            </div>
          ) : null
        }
      </form.Field>
    </section>
  )
}
