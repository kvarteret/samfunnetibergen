"use client";

import {
  FieldGroup,
  SectionHeader,
} from "@/components/ui/form-fields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CresatBooking } from "@/lib/integrations/crescat/calendar";
import type { ClosedDate, OpeningHours } from "@/lib/opening-hours";
import {
  KARAOKE_DURATION_OPTIONS,
  type KaraokeDerivedState,
} from "../domain/formState";
import { useKaraokeForm } from "./karaokeFormContext";
import { KaraokeSelect } from "./KaraokeFormPrimitives";
import { KaraokeFormSlotPicker } from "./KaraokeFormSlotPicker";

interface KaraokeDetailsSectionProps {
  uid: string;
  derived: KaraokeDerivedState;
  today: string;
  bookings: CresatBooking[];
  operationsManagerHours?: OpeningHours | null;
  houseClosedDates?: ClosedDate[] | null;
}

export function KaraokeFormDetailsSection({
  uid,
  derived,
  today,
  bookings,
  operationsManagerHours,
  houseClosedDates,
}: KaraokeDetailsSectionProps) {
  const form = useKaraokeForm();
  const values = form.state.values;

  return (
    <section className="space-y-6">
      <SectionHeader number="01" title="Detaljer" />

      <FieldGroup>
        <Label htmlFor={`${uid}-eventName`}>Navn på arrangement *</Label>
        <Input
          autoComplete="off"
          id={`${uid}-eventName`}
          onChange={(event) =>
            form.setFieldValue("eventName", event.target.value)
          }
          placeholder="F.eks. Bursdagsfeiring"
          required
          value={values.eventName}
        />
      </FieldGroup>

      <FieldGroup>
        <Label htmlFor={`${uid}-duration`}>Varighet</Label>
        <KaraokeSelect
          id={`${uid}-duration`}
          value={String(values.duration)}
          onChange={(value) =>
            form.setFieldValue("duration", Number(value))
          }
        >
          {KARAOKE_DURATION_OPTIONS.map((hours) => (
            <option key={hours} value={hours}>
              {hours} {hours === 1 ? "time" : "timer"}
            </option>
          ))}
        </KaraokeSelect>
      </FieldGroup>

      {today && (
        <FieldGroup>
          <Label>Dato og tidspunkt *</Label>
          <KaraokeFormSlotPicker
            bookings={bookings}
            duration={values.duration}
            selectedDate={values.startDate}
            selectedSlotMin={values.startSlotMin}
            today={today}
            operationsManagerHours={operationsManagerHours}
            houseClosedDates={houseClosedDates}
            onDateChange={(date) => {
              form.setFieldValue("startDate", date);
              form.setFieldValue("startSlotMin", null);
            }}
            onSlotChange={(slotMin) =>
              form.setFieldValue("startSlotMin", slotMin)
            }
          />
          {derived.startTime && (
            <p className="text-sm text-foreground/60 font-heading mt-1">
              {derived.startTime} → {derived.endTime}
            </p>
          )}
        </FieldGroup>
      )}
    </section>
  );
}
