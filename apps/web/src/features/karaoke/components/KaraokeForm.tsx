"use client"

import { useForm, useStore } from "@tanstack/react-form"
import posthog from "posthog-js"
import type { FormEvent } from "react"
import { useEffect, useId, useRef, useState } from "react"
import { ErrorSummary } from "@/components/ui/error-summary"
import type { CresatBooking } from "@/lib/integrations/crescat/calendar"
import {
  type ClosedDate,
  isoDate,
  type OpeningHours,
  slotRangesForDate,
  type VacationMode,
} from "@/lib/opening-hours"
import { GENERIC_SUBMIT_ERROR } from "@/lib/submission-messages"
import { useFormErrors } from "@/lib/use-form-errors"
import { useCurrentTime } from "@/lib/use-current-time"
import { getFormValidationIssues } from "@/lib/form-validation-errors"
import { fetchKaraokeAvailability } from "../actions/karaoke-availability"
import { submitKaraokeBooking } from "../actions/submit-karaoke-booking"
import {
  KARAOKE_DATE_COUNT,
  slotOverlapsKaraokeBookings,
} from "../domain/availability"
import {
  deriveKaraokeState,
  initialKaraokeState,
  type KaraokeFormState,
} from "../domain/formState"
import { karaokeFormSchema } from "../domain/karaokeFormSchema"
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
  vacationMode?: VacationMode | null
  initialNow: string
}

export function KaraokeForm({
  room,
  operationsManagerHours,
  houseClosedDates,
  vacationMode,
  initialNow,
}: KaraokeFormProps) {
  const uid = useId()
  const [bookings, setBookings] = useState<CresatBooking[]>([])
  const [honeypot, setHoneypot] = useState("")
  const honeypotId = `${uid}-hp`
  const today = isoDate(useCurrentTime(initialNow))
  const fieldIds = {
    eventName: `${uid}-eventName`,
    startDate: `${uid}-startDate`,
    contactName: `${uid}-contactName`,
    contactEmail: `${uid}-contactEmail`,
    numberOfPeople: `${uid}-numberOfPeople`,
    acceptTerms: `${uid}-acceptTerms`,
    studentProof: `${uid}-studentProof`,
  }

  const form = useForm({
    defaultValues: initialKaraokeState as KaraokeFormState,
    validators: {
      onChange: karaokeFormSchema,
      onSubmit: karaokeFormSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      const result = await submitKaraokeBooking({ ...value, honeypot })
      if (!result.ok) {
        formApi.setErrorMap({ onServer: result.error as never })
        throw new Error(result.error)
      }
    },
  })
  const values = useStore(form.store, state => state.values)
  const isSubmitSuccessful = useStore(
    form.store,
    state => state.isSubmitSuccessful,
  )
  const errorMap = useStore(form.store, state => state.errorMap)
  const submitError =
    typeof errorMap.onServer === "string" ? errorMap.onServer : undefined

  const derived = deriveKaraokeState(values)
  const validationErrors = getFormValidationIssues(
    errorMap.onChange,
    errorMap.onSubmit,
  ).map(issue => ({
    fieldId: karaokeFieldId(issue.path, fieldIds),
    message: issue.message,
  }))
  const { visibleErrors, markSubmitAttempt, errorFor } =
    useFormErrors(validationErrors)

  useEffect(() => {
    const end = new Date(today)
    end.setDate(end.getDate() + KARAOKE_DATE_COUNT)
    fetchKaraokeAvailability(today, isoDate(end)).then(setBookings)
  }, [today])

  useEffect(() => {
    if (!values.startDate || values.startSlotMin === null) return
    const allowedSlots = slotRangesForDate(
      values.startDate,
      values.duration,
      operationsManagerHours,
      houseClosedDates,
      vacationMode,
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
    vacationMode,
    values.duration,
    values.startDate,
    values.startSlotMin,
  ])

  const hasStartedRef = useRef(false)
  const markStarted = () => {
    if (hasStartedRef.current) return
    hasStartedRef.current = true
    posthog.capture("karaoke_booking_started")
  }

  if (isSubmitSuccessful) {
    return <KaraokeBookingSuccess />
  }

  return (
    <KaraokeFormContext.Provider value={form}>
      <div className="grid gap-12 items-start lg:grid-two-one">
        <form
          className="min-w-0 space-y-14"
          noValidate
          onFocusCapture={markStarted}
          onSubmit={(e: FormEvent) => {
            e.preventDefault()
            markSubmitAttempt()
            form.setErrorMap({ onServer: undefined })
            void form.handleSubmit().catch(() => {
              if (form.state.errorMap.onServer) return
              form.setErrorMap({ onServer: GENERIC_SUBMIT_ERROR as never })
              posthog.captureException(
                new Error("Unexpected karaoke booking submission failure"),
                {
                  form_id: "karaoke_booking",
                  validation_stage: "client",
                  failure_branch: "unexpected_submission_failure",
                },
              )
            })
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
            vacationMode={vacationMode}
            eventNameError={errorFor(fieldIds.eventName)}
            eventNameId={fieldIds.eventName}
            startDateError={errorFor(fieldIds.startDate)}
            startDateId={fieldIds.startDate}
          />
          <KaraokeFormPackageSection
            derived={derived}
            numberOfPeopleError={errorFor(fieldIds.numberOfPeople)}
            numberOfPeopleId={fieldIds.numberOfPeople}
            uid={uid}
          />
          <KaraokeFormContactSection
            contactEmailError={errorFor(fieldIds.contactEmail)}
            contactEmailId={fieldIds.contactEmail}
            contactNameError={errorFor(fieldIds.contactName)}
            contactNameId={fieldIds.contactName}
            uid={uid}
          />
          <KaraokeFormTermsSection
            acceptTermsError={errorFor(fieldIds.acceptTerms)}
            acceptTermsId={fieldIds.acceptTerms}
            studentProofError={errorFor(fieldIds.studentProof)}
            studentProofId={fieldIds.studentProof}
          />
          {/* Honeypot — invisible to humans, filled by bots. */}
          <input
            aria-hidden="true"
            autoComplete="off"
            className="absolute opacity-0 pointer-events-none h-0 w-0"
            id={honeypotId}
            name="honeypot"
            onChange={e => setHoneypot(e.target.value)}
            tabIndex={-1}
            type="text"
            value={honeypot}
          />
          <KaraokeFormSubmitSection submitError={submitError} />
        </form>

        <aside className="space-y-5 lg:sticky lg:top-24">
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
  | "numberOfPeople"
  | "acceptTerms"
  | "studentProof",
  string
>

function karaokeFieldId(path: string, fieldIds: KaraokeFieldIds): string {
  if (path === "startDate" || path === "startSlotMin") {
    return fieldIds.startDate
  }
  if (path === "eventName") return fieldIds.eventName
  if (path === "contactName") return fieldIds.contactName
  if (path === "contactEmail") return fieldIds.contactEmail
  if (path === "numberOfPeople") return fieldIds.numberOfPeople
  if (path === "acceptTerms") return fieldIds.acceptTerms
  if (path === "studentProofAccepted") return fieldIds.studentProof
  return fieldIds.startDate
}
