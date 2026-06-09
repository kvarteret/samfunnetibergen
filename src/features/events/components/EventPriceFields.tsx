"use client";

import {
  CheckboxSquare,
  FieldHint,
  PriceInput,
  SectionHeader,
} from "@/components/ui/form-fields";
import type { SetFormField } from "../domain/formState";

interface EventPriceFieldsProps {
  uid: string;
  isFree: boolean;
  priceOrdinar: string;
  priceStudent: string;
  priceMedlem: string;
  setField: SetFormField;
}

export function EventPriceFields({
  uid,
  isFree,
  priceOrdinar,
  priceStudent,
  priceMedlem,
  setField,
}: EventPriceFieldsProps) {
  return (
    <section className="space-y-6">
      <SectionHeader number="06" title="Pris" />

      <label className="group flex cursor-pointer items-center gap-3">
        <CheckboxSquare checked={isFree} onChange={setField("isFree")} />
        <span className="font-heading text-sm text-foreground">
          Gratis inngang
        </span>
      </label>

      {!isFree && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <PriceInput
            id={`${uid}-priceOrdinar`}
            label="Ordinær"
            onChange={setField("priceOrdinar")}
            value={priceOrdinar}
          />
          <PriceInput
            id={`${uid}-priceStudent`}
            label="Student"
            onChange={setField("priceStudent")}
            value={priceStudent}
          />
          <PriceInput
            id={`${uid}-priceMedlem`}
            label="Medlem"
            onChange={setField("priceMedlem")}
            value={priceMedlem}
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
