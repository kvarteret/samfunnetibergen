"use client";

import {
  CheckboxSquare,
  SectionHeader,
} from "@/components/ui/form-fields";
import { Link } from "@/i18n/navigation";
import type { PriceType } from "../types";
import { useKaraokeForm } from "./karaokeFormContext";

export function KaraokeTermsSection() {
  const form = useKaraokeForm();
  const values = form.state.values;
  const priceType = values.priceType as PriceType;

  return (
    <section className="space-y-4">
      <SectionHeader number="04" title="Vilkår" />
      <label className="group flex cursor-pointer items-start gap-3">
        <CheckboxSquare
          checked={values.acceptTerms}
          onChange={(v) => form.setFieldValue("acceptTerms", v)}
        />
        <span className="text-sm leading-6 text-foreground/80">
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
      </label>
      {priceType === "student" && (
        <label className="group flex cursor-pointer items-start gap-3">
          <CheckboxSquare
            checked={values.studentProofAccepted}
            onChange={(v) =>
              form.setFieldValue("studentProofAccepted", v)
            }
          />
          <span className="text-sm leading-6 text-foreground/80">
            Jeg lover å ta med studentbevis 🤞
          </span>
        </label>
      )}
    </section>
  );
}
