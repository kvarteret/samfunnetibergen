"use client";

import { UtensilsCrossed } from "lucide-react";

import { FieldHint, SectionHeader } from "@/components/ui/form-fields";
import {
  composeCatering,
  type BookingFormState,
  type SetBookingField,
} from "../domain/formState";
import { BookingTextarea, BookingToggleOption } from "./BookingPrimitives";

interface BookingCateringBarSectionProps {
  state: BookingFormState;
  setField: SetBookingField;
  uid: string;
}

export function BookingCateringBarSection({
  state,
  setField,
  uid,
}: BookingCateringBarSectionProps) {
  const cateringSummary = composeCatering(state);
  return (
    <section className="space-y-6">
      <SectionHeader number="05" title="Mat og bar" />
      <div className="max-w-3xl space-y-4">
        <BookingToggleOption
          checked={state.cateringCustom}
          icon={UtensilsCrossed}
          label="Skreddersydd meny"
          onChange={setField("cateringCustom")}
        >
          {state.cateringCustom && (
            <div className="mt-3">
              <BookingTextarea
                id={`${uid}-catering`}
                onChange={setField("cateringText")}
                placeholder="Beskriv ønsker om mat, snacks eller drikke."
                value={state.cateringText}
              />
            </div>
          )}
        </BookingToggleOption>
        <BookingToggleOption
          checked={state.bar}
          icon={UtensilsCrossed}
          label="Kvarteret stiller i bar"
          onChange={setField("bar")}
        >
          <FieldHint>Pris: 2000 kr eks. mva. Forutsetter kapasitet.</FieldHint>
        </BookingToggleOption>
        {cateringSummary && (
          <p className="whitespace-pre-line border-l-2 border-border pl-4 text-sm leading-6 text-foreground/70">
            {cateringSummary}
          </p>
        )}
      </div>
    </section>
  );
}
