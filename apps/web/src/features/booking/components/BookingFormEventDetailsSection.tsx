"use client"

import type { AnyFieldApi } from "@tanstack/react-form"
import { useId } from "react"
import { BookingEventTimes } from "@/components/ui/date-time-picker"
import { FieldGroup } from "@/components/ui/field-group"
import { FormSection } from "@/components/ui/form-section"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NumberField } from "@/components/ui/number-field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import type {
  ClosedDate,
  OpeningHours,
  VacationMode,
} from "@/lib/opening-hours"
import type { BookingFormValues } from "./BookingForm"
import { useBookingForm } from "./bookingFormContext"

const OPEN_CLOSED_OPTIONS = [
  { value: "Åpent", label: "Åpent arrangement" },
  { value: "Lukket", label: "Lukket arrangement" },
]

interface BookingFormEventDetailsSectionProps {
  audienceCountError?: string
  audienceCountId: string
  doorsTimeError?: string
  doorsTimeId: string
  eventNameError?: string
  eventNameId: string
  openingHours: OpeningHours | null
  roomOpeningHours: OpeningHours | null
  closedDates: ClosedDate[]
  vacationMode?: VacationMode | null
}

export function BookingFormEventDetailsSection({
  audienceCountError,
  audienceCountId,
  doorsTimeError,
  doorsTimeId,
  eventNameError,
  eventNameId,
  openingHours,
  roomOpeningHours,
  closedDates,
  vacationMode,
}: BookingFormEventDetailsSectionProps) {
  const uid = useId()
  const form = useBookingForm()
  const audienceCountErrorId = `${audienceCountId}-error`
  const eventNameErrorId = `${eventNameId}-error`

  return (
    <FormSection number="03" title="Arrangement">
      <div className="grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldGroup
          className="sm:col-span-2"
          error={eventNameError}
          errorId={eventNameErrorId}
        >
          <Label htmlFor={eventNameId}>Navn på arrangement *</Label>
          <form.Field name="eventName">
            {(field: AnyFieldApi) => (
              <Input
                autoComplete="off"
                aria-describedby={eventNameError ? eventNameErrorId : undefined}
                aria-invalid={!!eventNameError}
                id={eventNameId}
                onChange={e => field.handleChange(e.target.value)}
                placeholder="F.eks. konsert, møte, foredrag"
                value={field.state.value as string}
              />
            )}
          </form.Field>
        </FieldGroup>
        <FieldGroup error={audienceCountError} errorId={audienceCountErrorId}>
          <Label htmlFor={audienceCountId}>Estimert antall publikum *</Label>
          <form.Field name="audienceCount">
            {(field: AnyFieldApi) => (
              <NumberField
                aria-describedby={
                  audienceCountError ? audienceCountErrorId : undefined
                }
                aria-invalid={!!audienceCountError}
                className="w-40"
                id={audienceCountId}
                min={0}
                onValueChange={value =>
                  field.handleChange(value === null ? "" : String(value))
                }
                placeholder="F.eks. 50"
                value={
                  field.state.value === ""
                    ? null
                    : Number(field.state.value as string)
                }
              />
            )}
          </form.Field>
        </FieldGroup>
        <FieldGroup>
          <Label>Type arrangement</Label>
          <form.Field name="openOrClosed">
            {(field: AnyFieldApi) => (
              <RadioGroup<string>
                onValueChange={field.handleChange}
                value={field.state.value as string}
              >
                {OPEN_CLOSED_OPTIONS.map(opt => (
                  <RadioGroupItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </RadioGroupItem>
                ))}
              </RadioGroup>
            )}
          </form.Field>
        </FieldGroup>
        <FieldGroup className="sm:col-span-2">
          <Label htmlFor={`${uid}-description`}>Beskrivelse</Label>
          <form.Field name="description">
            {(field: AnyFieldApi) => (
              <Textarea
                className="resize-y"
                id={`${uid}-description`}
                onChange={e => field.handleChange(e.target.value)}
                placeholder="Fortell oss kort om arrangementet ditt..."
                rows={4}
                value={field.state.value as string}
              />
            )}
          </form.Field>
        </FieldGroup>
      </div>

      <form.Subscribe
        selector={(state: { values: BookingFormValues }) => ({
          startDate: state.values.startDate,
          endDate: state.values.endDate,
          startTime: state.values.startTime,
          endTime: state.values.endTime,
          doorsTimes: state.values.doorsTimes,
          estimatedEndTimes: state.values.estimatedEndTimes,
        })}
      >
        {({
          startDate,
          endDate,
          startTime,
          endTime,
          doorsTimes,
          estimatedEndTimes,
        }) => (
          <BookingEventTimes
            closedDates={closedDates}
            doorsTimeError={doorsTimeError}
            doorsTimeId={doorsTimeId}
            doorsTimes={doorsTimes}
            endDate={endDate}
            endTime={endTime}
            estimatedEndTimes={estimatedEndTimes}
            key={`${startDate}-${endDate}`}
            onDoorsChange={(dayIndex, value) => {
              const next = [...doorsTimes]
              next[dayIndex] = value
              form.setFieldValue("doorsTimes", next)
            }}
            onEstimatedEndChange={(dayIndex, value) => {
              const next = [...estimatedEndTimes]
              next[dayIndex] = value
              form.setFieldValue("estimatedEndTimes", next)
            }}
            openingHours={openingHours}
            roomOpeningHours={roomOpeningHours}
            startDate={startDate}
            startTime={startTime}
            uid={uid}
            vacationMode={vacationMode}
          />
        )}
      </form.Subscribe>
    </FormSection>
  )
}
