"use client";

import {
  CheckboxSquare,
  FieldHint,
  PriceInput,
  SectionHeader,
} from "@/components/ui/form-fields";
import { useEventForm } from "./eventFormContext";

interface EventPriceFieldsProps {
  uid: string;
}

export function EventFormPriceSection({ uid }: EventPriceFieldsProps) {
  const form = useEventForm();
  const values = form.state.values;

  return (
    <section className="space-y-6">
      <SectionHeader number="06" title="Pris" />

      <label className="group flex cursor-pointer items-center gap-3">
        <CheckboxSquare
          checked={values.isFree}
          onChange={(v) => form.setFieldValue("isFree", v)}
        />
        <span className="font-heading text-sm text-foreground">
          Gratis inngang
        </span>
      </label>

      {!values.isFree && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <PriceInput
            id={`${uid}-priceOrdinar`}
            label="Ordinær"
            onChange={(v) => form.setFieldValue("priceOrdinar", v)}
            value={values.priceOrdinar}
          />
          <PriceInput
            id={`${uid}-priceStudent`}
            label="Student"
            onChange={(v) => form.setFieldValue("priceStudent", v)}
            value={values.priceStudent}
          />
          <PriceInput
            id={`${uid}-priceMedlem`}
            label="Medlem"
            onChange={(v) => form.setFieldValue("priceMedlem", v)}
            value={values.priceMedlem}
          />
        </div>
      )}

      <FieldHint>
        Alle prisfelt er valgfrie. La dem stå tomme om du er usikker - vi tar
        gjerne kontakt for avklaring.
      </FieldHint>
    </section>
  );
}
