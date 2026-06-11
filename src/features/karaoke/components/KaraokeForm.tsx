"use client"

import { useForm } from "@tanstack/react-form"
import type { FormEvent } from "react"
import { useEffect, useId, useState } from "react"
import {
  ErrorSummary,
  type ErrorSummaryItem,
} from "@/components/ui/error-summary"
import type { CresatBooking } from "@/lib/integrations/crescat/calendar"
import {
  type ClosedDate,
  isoDate,
  type OpeningHours,
  slotRangesForDate,
} from "@/lib/opening-hours"
import { fetchKaraokeAvailability } from "../actions/karaoke-availability"
import { submitKaraokeBooking } from "../actions/submit-karaoke-booking"
import {
  KARAOKE_DATE_COUNT,
  slotOverlapsKaraokeBookings,
} from "../domain/availability"
import {
  buildKaraokePayload,
  deriveKaraokeState,
  initialKaraokeState,
  type KaraokeFormState,
} from "../domain/formState"
import type { KaraokeRoom } from "../types"
import { KaraokeFormContactSection } from "./KaraokeFormContactSection"
import { KaraokeFormDetailsSection } from "./KaraokeFormDetailsSection"
import { KaraokeOrderPreview } from "./KaraokeFormOrderSummary"
import { KaraokeFormPackageSection } from "./KaraokeFormPackageSection"
import { KaraokeFormRoomCard } from "./KaraokeFormRoomCard"
import {
  KaraokeBookingSuccess,
  KaraokeFormSubmitSection,
} from "./KaraokeFormSubmitSection"
import { KaraokeFormTermsSection } from "./KaraokeFormTermsSection"
import { KaraokeFormContext } from "./karaokeFormContext"

interface KaraokeFormProps {
  room: KaraokeRoom
  operationsManagerHours?: OpeningHours | null
  houseClosedDates?: ClosedDate[] | null
}

export function KaraokeForm({
  room,
  operationsManagerHours,
  houseClosedDates,
}: KaraokeFormProps) {
  const uid = useId()
  const [bookings, setBookings] = useState<CresatBooking[]>([])
  const [hasSubmittedInvalid, setHasSubmittedInvalid] = useState(false)
  const today = isoDate(new Date())
  const fieldIds = {
    eventName: `${uid}-eventName`,
    startDate: `${uid}-startDate`,
    contactName: `${uid}-contactName`,
    contactEmail: `${uid}-contactEmail`,
    acceptTerms: `${uid}-acceptTerms`,
    studentProof: `${uid}-studentProof`,
  }

  const form = useForm({
    defaultValues: initialKaraokeState as KaraokeFormState,
    onSubmit: async ({ value }) => {
      const derived = deriveKaraokeState(value)
      const result = await submitKaraokeBooking(
        buildKaraokePayload(value, derived),
      )
      if (!result.ok) throw new Error(result.error)
    },
  })

  const derived = deriveKaraokeState(form.state.values)
  const validationErrors = getKaraokeValidationErrors(
    form.state.values,
    fieldIds,
  )
  const visibleErrors = hasSubmittedInvalid ? validationErrors : []
  const getFieldError = (fieldId: string) =>
    visibleErrors.find(error => error.fieldId === fieldId)?.message

  useEffect(() => {
    const end = new Date(today)
    end.setDate(end.getDate() + KARAOKE_DATE_COUNT)
    fetchKaraokeAvailability(today, isoDate(end)).then(setBookings)
  }, [today])

  useEffect(() => {
    const values = form.state.values
    if (!values.startDate || values.startSlotMin === null) return
    const allowedSlots = slotRangesForDate(
      values.startDate,
      values.duration,
      operationsManagerHours,
      houseClosedDates,
    )
    const slotTaken = slotOverlapsKaraokeBookings(
      values.startDate,
      values.startSlotMin,
      values.duration,
      bookings,
    )
    if (!allowedSlots.includes(values.startSlotMin) || slotTaken) {
      form.setFieldValue("startSlotMin", null)
    }
  }, [
    bookings,
    form,
    houseClosedDates,
    operationsManagerHours,
    form.state.values.duration,
    form.state.values.startDate,
    form.state.values.startSlotMin,
  ])

  if (form.state.isSubmitSuccessful) {
    return <KaraokeBookingSuccess />
  }

  return (
    <KaraokeFormContext.Provider value={form}>
      <div className="grid gap-12 items-start lg:grid-two-one">
        <form
          className="min-w-0 space-y-14"
          noValidate
          onSubmit={(e: FormEvent) => {
            e.preventDefault()
            setHasSubmittedInvalid(true)
            if (validationErrors.length > 0) return
            form.handleSubmit()
          }}
        >
          {visibleErrors.length > 0 && (
            <ErrorSummary className="max-w-3xl" errors={visibleErrors} />
          )}
          <KaraokeFormDetailsSection
            derived={derived}
            uid={uid}
            today={today}
            bookings={bookings}
            houseClosedDates={houseClosedDates}
            operationsManagerHours={operationsManagerHours}
            eventNameError={getFieldError(fieldIds.eventName)}
            eventNameId={fieldIds.eventName}
            startDateError={getFieldError(fieldIds.startDate)}
            startDateId={fieldIds.startDate}
          />
          <KaraokeFormPackageSection uid={uid} derived={derived} />
          <KaraokeFormContactSection
            contactEmailError={getFieldError(fieldIds.contactEmail)}
            contactEmailId={fieldIds.contactEmail}
            contactNameError={getFieldError(fieldIds.contactName)}
            contactNameId={fieldIds.contactName}
            uid={uid}
          />
          <KaraokeFormTermsSection
            acceptTermsError={getFieldError(fieldIds.acceptTerms)}
            acceptTermsId={fieldIds.acceptTerms}
            studentProofError={getFieldError(fieldIds.studentProof)}
            studentProofId={fieldIds.studentProof}
          />
          <KaraokeFormSubmitSection />
        </form>

        <aside className="space-y-5 lg:sticky lg:top-8">
          <KaraokeOrderPreview derived={derived} />
          <KaraokeFormRoomCard room={room} />
        </aside>
      </div>
    </KaraokeFormContext.Provider>
  )
}

type KaraokeFieldIds = Record<
  | "eventName"
  | "startDate"
  | "contactName"
  | "contactEmail"
  | "acceptTerms"
  | "studentProof",
  string
>

function getKaraokeValidationErrors(
  values: KaraokeFormState,
  fieldIds: KaraokeFieldIds,
): ErrorSummaryItem[] {
  const errors: ErrorSummaryItem[] = []

  if (!values.eventName.trim()) {
    errors.push({
      fieldId: fieldIds.eventName,
      message: "Skriv inn navn på arrangementet.",
    })
  }
  if (!values.startDate || values.startSlotMin === null) {
    errors.push({
      fieldId: fieldIds.startDate,
      message: "Velg dato og starttidspunkt.",
    })
  }
  if (!values.contactName.trim()) {
    errors.push({
      fieldId: fieldIds.contactName,
      message: "Skriv inn navn på kontaktperson.",
    })
  }
  if (!values.contactEmail.trim()) {
    errors.push({
      fieldId: fieldIds.contactEmail,
      message: "Skriv inn e-postadresse.",
    })
  }
  if (!values.acceptTerms) {
    errors.push({
      fieldId: fieldIds.acceptTerms,
      message: "Bekreft at du godtar bruksvilkårene.",
    })
  }
  if (values.priceType === "student" && !values.studentProofAccepted) {
    errors.push({
      fieldId: fieldIds.studentProof,
      message: "Bekreft at du tar med studentbevis.",
    })
  }

  return errors
}
