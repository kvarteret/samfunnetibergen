"use client"

import type { AnyFieldApi } from "@tanstack/react-form"
import { FieldGroup } from "@/components/ui/field-group"
import { FormSection } from "@/components/ui/form-section"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SelectField } from "@/components/ui/select-field"
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
  eventNameError?: string
  eventNameId: string
  startDateError?: string
  startDateId: string
}

export function KaraokeFormDetailsSection({
  uid,
  derived,
  today,
  bookings,
  operationsManagerHours,
  houseClosedDates,
  eventNameError,
  eventNameId,
  startDateError,
  startDateId,
}: KaraokeFormDetailsSectionProps) {
  const form = useKaraokeForm()
  const eventNameErrorId = `${eventNameId}-error`
  const startDateErrorId = `${startDateId}-error`

  return (
    <FormSection number="01" title="Detaljer">
      <FieldGroup error={eventNameError} errorId={eventNameErrorId}>
        <Label htmlFor={eventNameId}>Navn på arrangement *</Label>
        <form.Field name="eventName">
          {(field: AnyFieldApi) => (
            <Input
              aria-describedby={eventNameError ? eventNameErrorId : undefined}
              aria-invalid={!!eventNameError}
              autoComplete="off"
              id={eventNameId}
              onChange={event => field.handleChange(event.target.value)}
              placeholder="F.eks. Bursdagsfeiring"
              required
              value={field.state.value as string}
            />
          )}
        </form.Field>
      </FieldGroup>

      <form.Field name="duration">
        {(durationField: AnyFieldApi) => (
          <>
            <SelectField
              id={`${uid}-duration`}
              label="Varighet"
              onChange={value => durationField.handleChange(Number(value))}
              value={String(durationField.state.value)}
            >
              {KARAOKE_DURATION_OPTIONS.map(hours => (
                <option key={hours} value={hours}>
                  {hours} {hours === 1 ? "time" : "timer"}
                </option>
              ))}
            </SelectField>

            {today && (
              <form.Field name="startDate">
                {(dateField: AnyFieldApi) => (
                  <form.Field name="startSlotMin">
                    {(slotField: AnyFieldApi) => (
                      <FieldGroup
                        error={startDateError}
                        errorId={startDateErrorId}
                      >
                        <Label>Dato og tidspunkt *</Label>
                        <KaraokeFormSlotPicker
                          aria-describedby={
                            startDateError ? startDateErrorId : undefined
                          }
                          aria-invalid={!!startDateError}
                          bookings={bookings}
                          duration={durationField.state.value as number}
                          id={startDateId}
                          selectedDate={dateField.state.value as string}
                          selectedSlotMin={
                            slotField.state.value as number | null
                          }
                          today={today}
                          operationsManagerHours={operationsManagerHours}
                          houseClosedDates={houseClosedDates}
                          onDateChange={date => {
                            dateField.handleChange(date)
                            slotField.handleChange(null)
                          }}
                          onSlotChange={slotField.handleChange}
                        />
                        {derived.startTime && (
                          <p className="text-base text-foreground-muted font-heading mt-1">
                            {derived.startTime} → {derived.endTime}
                          </p>
                        )}
                      </FieldGroup>
                    )}
                  </form.Field>
                )}
              </form.Field>
            )}
          </>
        )}
      </form.Field>
    </FormSection>
  )
}
