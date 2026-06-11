"use client"

import { CheckboxField } from "@/components/ui/checkbox-field"
import { SectionHeader } from "@/components/ui/section-header"
import { Link } from "@/i18n/navigation"
import type { PriceType } from "../types"
import { useKaraokeForm } from "./karaokeFormContext"

export function KaraokeFormTermsSection() {
  const form = useKaraokeForm()
  const values = form.state.values
  const priceType = values.priceType as PriceType

  return (
    <section className="space-y-4">
      <SectionHeader number="04" title="Vilkår" />
      <CheckboxField
        checked={values.acceptTerms}
        onChange={v => form.setFieldValue("acceptTerms", v)}
      >
        <span className="text-body text-foreground/80">
          Ved å krysse av denne boksen aksepterer jeg at jeg har lest, forstått
          og godkjenner{" "}
          <Link
            className="underline underline-offset-2 hover:text-foreground transition-colors"
            href="/vilkar-for-leie-av-karaoke"
          >
            bruksvilkårene
          </Link>
          .
        </span>
      </CheckboxField>
      {priceType === "student" && (
        <CheckboxField
          checked={values.studentProofAccepted}
          onChange={v => form.setFieldValue("studentProofAccepted", v)}
        >
          <span className="text-body text-foreground/80">
            Jeg lover å ta med studentbevis 🤞
          </span>
        </CheckboxField>
      )}
    </section>
  )
}
