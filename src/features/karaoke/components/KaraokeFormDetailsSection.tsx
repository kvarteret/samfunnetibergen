"use client"

import { FieldGroup } from "@/components/ui/field-group"
import { FormSection } from "@/components/ui/form-section"
import { SelectField } from "@/components/ui/select-field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { CresatBooking } from "@/lib/integrations/crescat/calendar"
import type { ClosedDate, OpeningHours } from "@/lib/opening-hours"
import {
  KARAOKE_DURATION_OPTIONS,
  type KaraokeDerivedState,
} from "../domain/formState"
import { KaraokeFormSlotPicker } from "./KaraokeFormSlotPicker"
import { useKaraokeForm } from "./karaokeFormContext"

interface KaraokeFormDetailsSectionProps {
  uid: string
  derived: KaraokeDerivedState
  today: string
  bookings: CresatBooking[]
  operationsManagerHours?: OpeningHours | null
  houseClosedDates?: ClosedDate[] | null
}

export function KaraokeFormDetailsSection({
  uid,
  derived,
  today,
  bookings,
  operationsManagerHours,
  houseClosedDates,
}: KaraokeFormDetailsSectionProps) {
  const form = useKaraokeForm()
  const values = form.state.values

  return (
    <FormSection number="01" title="Detaljer">
      <FieldGroup>
        <Label htmlFor={`${uid}-eventName`}>Navn på arrangement *</Label>
        <Input
          autoComplete="off"
          id={`${uid}-eventName`}
          onChange={event =>
            form.setFieldValue("eventName", event.target.value)
          }
          placeholder="F.eks. Bursdagsfeiring"
          required
          value={values.eventName}
        />
      </FieldGroup>

      <SelectField
        id={`${uid}-duration`}
        label="Varighet"
        onChange={value => form.setFieldValue("duration", Number(value))}
        value={String(values.duration)}
      >
        {KARAOKE_DURATION_OPTIONS.map(hours => (
          <option key={hours} value={hours}>
            {hours} {hours === 1 ? "time" : "timer"}
          </option>
        ))}
      </SelectField>

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
            onDateChange={date => {
              form.setFieldValue("startDate", date)
              form.setFieldValue("startSlotMin", null)
            }}
            onSlotChange={slotMin =>
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
    </FormSection>
  )
}
