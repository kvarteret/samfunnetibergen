"use client";

import { useId } from "react";
import { UtensilsCrossed } from "lucide-react";
import { FieldHint, SectionHeader } from "@/components/ui/form-fields";
import { composeCatering } from "../domain/formState";
import { BookingTextarea, BookingToggleOption } from "./BookingPrimitives";
import { useBookingForm } from "./bookingFormContext";

interface Props {}

export function BookingCateringBarSection({ }: Props) {
  const uid = useId();
  const form = useBookingForm();
  const values = form.state.values;
  return (
    <section className="space-y-6">
      <SectionHeader number="05" title="Mat og bar" />
      <div className="max-w-3xl space-y-4">
        <BookingToggleOption checked={values.cateringCustom} icon={UtensilsCrossed} label="Skreddersydd meny" onChange={(v) => form.setFieldValue("cateringCustom", v)}>
          {values.cateringCustom && (
            <div className="mt-3">
              <BookingTextarea id={`${uid}-catering`} onChange={(v) => form.setFieldValue("cateringText", v)} placeholder="Beskriv ønsker om mat, snacks eller drikke." value={values.cateringText} />
            </div>
          )}
        </BookingToggleOption>
        <BookingToggleOption checked={values.bar} icon={UtensilsCrossed} label="Kvarteret stiller i bar" onChange={(v) => form.setFieldValue("bar", v)}>
          <FieldHint>Pris: 2000 kr eks. mva. Forutsetter kapasitet.</FieldHint>
        </BookingToggleOption>
        {composeCatering(values) && (
          <p className="whitespace-pre-line border-l-2 border-border pl-4 text-sm leading-6 text-foreground/70">{composeCatering(values)}</p>
        )}
      </div>
    </section>
  );
}
