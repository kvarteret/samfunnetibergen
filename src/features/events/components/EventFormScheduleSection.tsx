"use client"
import { Plus, X } from "lucide-react"
import { useCallback } from "react"

import { CheckboxField } from "@/components/ui/checkbox-field"
import { FieldGroup } from "@/components/ui/field-group"
import { FormSection } from "@/components/ui/form-section"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tooltip } from "@/components/ui/tooltip"
import type { DateEntry, FormState } from "../domain/formState"
import { newDate } from "../domain/formState"
import { defaultRecurrenceRule } from "../domain/recurrence"
import { EventFormRecurrenceBuilder } from "./EventFormRecurrenceBuilder"
import { useEventForm } from "./eventFormContext"

interface EventFormScheduleSectionProps {
  uid: string
  firstDateError?: string
  firstDateId: string
}

export function EventFormScheduleSection({
  uid,
  firstDateError,
  firstDateId,
}: EventFormScheduleSectionProps) {
  const form = useEventForm()
  const handleRecurrenceChange = useCallback(
    (rrule: string) => form.setFieldValue("rrule", rrule),
    [form],
  )
  const handleRecurringToggle = useCallback(
    (isRecurring: boolean) => {
      form.setFieldValue("isRecurring", isRecurring)
      if (isRecurring) {
        form.setFieldValue("rrule", defaultRecurrenceRule)
      }
    },
    [form],
  )

  const handleAddDate = () => {
    form.setFieldValue("dates", (dates: DateEntry[]) => [...dates, newDate()])
  }

  const handleRemoveDate = (id: string) => {
    form.setFieldValue("dates", (dates: DateEntry[]) =>
      dates.filter(date => date.id !== id),
    )
  }

  const handleUpdateDate = (
    id: string,
    key: keyof DateEntry,
    value: string,
  ) => {
    form.setFieldValue("dates", (dates: DateEntry[]) =>
      dates.map(date => (date.id === id ? { ...date, [key]: value } : date)),
    )
  }

  return (
    <FormSection number="03" title="Dato og tid">
      <form.Subscribe selector={(s: { values: FormState }) => s.values.dates}>
        {(dates: DateEntry[]) => (
          <div className="space-y-4">
            {dates.map((date, index) => (
              <EventDateCard
                date={date}
                index={index}
                key={date.id}
                totalDates={dates.length}
                uid={uid}
                dateError={index === 0 ? firstDateError : undefined}
                dateId={index === 0 ? firstDateId : `${uid}-date-${date.id}`}
                removeDate={handleRemoveDate}
                updateDate={handleUpdateDate}
              />
            ))}

            <button
              className="flex w-full cursor-pointer items-center justify-center gap-2 border-2 border-dashed border-border bg-card px-4 py-2.5 font-heading text-foreground-muted transition-colors hover:border-primary hover:text-primary focus-brutal"
              onClick={handleAddDate}
              type="button"
            >
              <Plus aria-hidden className="size-4" />
              Legg til dato
            </button>
          </div>
        )}
      </form.Subscribe>

      <form.Subscribe
        selector={(s: { values: FormState }) => s.values.isRecurring}
      >
        {(isRecurring: boolean) => (
          <EventRecurrenceFields
            isRecurring={isRecurring}
            onRecurrenceChange={handleRecurrenceChange}
            onRecurringToggle={handleRecurringToggle}
          />
        )}
      </form.Subscribe>
    </FormSection>
  )
}

interface EventDateCardProps {
  uid: string
  date: DateEntry
  dateError?: string
  dateId: string
  index: number
  totalDates: number
  removeDate: (id: string) => void
  updateDate: (id: string, key: keyof DateEntry, value: string) => void
}

function EventDateCard({
  uid,
  date,
  dateError,
  dateId,
  index,
  totalDates,
  removeDate,
  updateDate,
}: EventDateCardProps) {
  const dateErrorId = `${dateId}-error`

  return (
    <div className="space-y-4 panel p-4">
      <div className="flex items-center justify-between">
        <p className="font-heading uppercase tracking-widest">
          Dato {totalDates > 1 ? index + 1 : ""}
        </p>
        {totalDates > 1 && (
          <Tooltip content="Fjern dato">
            <button
              aria-label="Fjern dato"
              className="cursor-pointer text-foreground-muted hover:text-destructive focus-brutal"
              onClick={() => removeDate(date.id)}
              type="button"
            >
              <X aria-hidden className="size-4" />
            </button>
          </Tooltip>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FieldGroup error={dateError} errorId={dateErrorId}>
          <Label htmlFor={dateId}>Dato *</Label>
          <Input
            aria-describedby={dateError ? dateErrorId : undefined}
            aria-invalid={!!dateError}
            id={dateId}
            onChange={event =>
              updateDate(date.id, "startDate", event.target.value)
            }
            required={index === 0}
            type="date"
            value={date.startDate}
          />
        </FieldGroup>

        <FieldGroup>
          <Label htmlFor={`${uid}-starttime-${date.id}`}>
            Starttid{" "}
            <span className="ml-1 font-sans font-normal text-foreground-muted">
              (anbefalt)
            </span>
          </Label>
          <Input
            id={`${uid}-starttime-${date.id}`}
            onChange={event =>
              updateDate(date.id, "startTime", event.target.value)
            }
            type="time"
            value={date.startTime}
          />
        </FieldGroup>

        <FieldGroup>
          <Label htmlFor={`${uid}-endtime-${date.id}`}>
            Sluttid{" "}
            <span className="ml-1 font-sans font-normal text-foreground-muted">
              (valgfritt)
            </span>
          </Label>
          <Input
            id={`${uid}-endtime-${date.id}`}
            onChange={event =>
              updateDate(date.id, "endTime", event.target.value)
            }
            type="time"
            value={date.endTime}
          />
        </FieldGroup>
      </div>
    </div>
  )
}

interface EventRecurrenceFieldsProps {
  isRecurring: boolean
  onRecurrenceChange: (rrule: string) => void
  onRecurringToggle: (isRecurring: boolean) => void
}

function EventRecurrenceFields({
  isRecurring,
  onRecurrenceChange,
  onRecurringToggle,
}: EventRecurrenceFieldsProps) {
  return (
    <div className="space-y-4">
      <CheckboxField
        checked={isRecurring}
        hint="Arrangementet gjentas etter et fast mønster (f.eks. ukentlig quiz, månedlig konsert)"
        label="Gjentagende arrangement"
        onChange={onRecurringToggle}
      />

      {isRecurring && (
        <EventFormRecurrenceBuilder onChange={onRecurrenceChange} />
      )}
    </div>
  )
}
