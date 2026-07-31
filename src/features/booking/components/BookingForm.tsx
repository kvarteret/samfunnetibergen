"use client"

import { useForm, useStore } from "@tanstack/react-form"
import { ArrowRight, Loader2, X } from "lucide-react"
import posthog from "posthog-js"
import { type FormEvent, useEffect, useId, useRef, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  ErrorSummary,
  type ErrorSummaryItem,
} from "@/components/ui/error-summary"
import { Link } from "@/i18n/navigation"
import type { CresatBooking } from "@/lib/integrations/crescat/calendar"
import { addDaysDateOnly } from "@/lib/integrations/crescat/datetime"
import {
  type ClosedDate,
  hasOpeningHoursRows,
  isoDate,
  isSlotAllowedForCombinedHours,
  type OpeningHours,
  type VacationMode,
} from "@/lib/opening-hours"
import { useFormErrors } from "@/lib/use-form-errors"
import { GENERIC_SUBMIT_ERROR } from "@/lib/submission-messages"
import type { AppFormApi } from "@/lib/form-api"
import { fetchBookableRoomsForBooker } from "../actions/bookable-rooms"
import { fetchRoomAvailability } from "../actions/room-availability"
import { submitRoomBooking } from "../actions/submit-room-booking"
import {
  durationHoursBetween,
  findRoomConflicts,
  occupiedMinuteRanges,
} from "../domain/availability"
import {
  type BookingFormState,
  bookingFormSchema,
} from "../domain/bookingFormSchema"
import { initialBookingState } from "../domain/formState"
import type { BookingRoom } from "../types"
import { BookingFormBookerTypeSection } from "./BookingFormBookerTypeSection"
import { BookingFormCateringBarSection } from "./BookingFormCateringBarSection"
import { BookingFormContactSection } from "./BookingFormContactSection"
import { BookingFormEventDetailsSection } from "./BookingFormEventDetailsSection"
import { BookingFormNeedsSection } from "./BookingFormNeedsSection"
import { BookingFormOrderSummary } from "./BookingFormOrderSummary"
import { BookingFormScheduleSection } from "./BookingFormScheduleSection"
import { BookingFormTermsSection } from "./BookingFormTermsSection"
import { BookingFormTicketSection } from "./BookingFormTicketSection"
import { BookingPromotionSection } from "./BookingPromotionSection"
import { BookingFormContext } from "./bookingFormContext"

export type BookingFormValues = BookingFormState

const DATE_COUNT = 7
const TIVOLI_CRESCAT_ROOM_ID = 95

interface BookingFormProps {
  initialRooms: BookingRoom[]
  initialRoomId?: number
  openingHours: OpeningHours | null
  closedDates: ClosedDate[]
  vacationMode?: VacationMode | null
  rentalTermsContent: string | null
  cancellationTermsContent: string | null
}

export function BookingForm({
  initialRooms,
  initialRoomId,
  openingHours,
  closedDates,
  vacationMode,
  rentalTermsContent,
  cancellationTermsContent,
}: BookingFormProps) {
  const uid = useId()
  const [rooms, setRooms] = useState<BookingRoom[]>(initialRooms)
  const [honeypot, setHoneypot] = useState("")
  const honeypotId = `${uid}-hp`
  const [bookings, setBookings] = useState<CresatBooking[]>([])
  const today = isoDate(new Date())
  const fieldIds = {
    studentOrgName: `${uid}-studentOrg`,
    startDate: `${uid}-startDate`,
    eventName: `${uid}-eventName`,
    audienceCount: `${uid}-audience`,
    tickets: `${uid}-tickets`,
    furniture: `${uid}-furniture`,
    contactName: `${uid}-contactName`,
    contactEmail: `${uid}-contactEmail`,
    invoiceAddress: `${uid}-invoiceAddress`,
    orgNumber: `${uid}-orgNumber`,
    acceptTerms: `${uid}-acceptTerms`,
    promote: `${uid}-promote`,
  }
  const form = useForm({
    defaultValues: {
      ...initialBookingState,
      selectedRoomIds:
        initialRoomId != null &&
        initialRooms.some(r => r.crescatRoomId === initialRoomId)
          ? [initialRoomId]
          : [],
    } as BookingFormValues,
    validators: {
      onChange: bookingFormSchema,
      onSubmit: bookingFormSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      const result = await submitRoomBooking({ ...value, honeypot })
      if (!result.ok) {
        formApi.setErrorMap({ onServer: result.error as never })
        throw new Error(result.error)
      }

      posthog.capture("room_booking_submitted", {
        promote: value.promote === "ja",
      })
    },
  })
  const values = useStore(form.store, state => state.values)
  const isSubmitting = useStore(form.store, state => state.isSubmitting)
  const isSubmitSuccessful = useStore(
    form.store,
    state => state.isSubmitSuccessful,
  )
  const errorMap = useStore(form.store, state => state.errorMap)
  const submitError =
    typeof errorMap.onServer === "string" ? errorMap.onServer : undefined
  const bookerType = values.bookerType

  const selectedRooms = rooms.filter(room =>
    values.selectedRoomIds.includes(room.crescatRoomId),
  )

  useEffect(() => {
    let active = true
    fetchBookableRoomsForBooker(bookerType).then(next => {
      if (!active) return
      setRooms(next)
      const nextIds = new Set(next.map(r => r.crescatRoomId))
      const stillOffered = form.state.values.selectedRoomIds.filter(id =>
        nextIds.has(id),
      )
      form.setFieldValue(
        "selectedRoomIds",
        stillOffered.length ? stillOffered : [],
      )
    })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookerType])

  const selectedStartDate = values.startDate

  useEffect(() => {
    let active = true
    // Fetch around the selected date when available, otherwise fetch from today.
    const windowStart = selectedStartDate || today
    fetchRoomAvailability(
      bookerType,
      windowStart,
      addDaysDateOnly(windowStart, DATE_COUNT),
    ).then(result => {
      if (active) setBookings(result)
    })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookerType, selectedStartDate])

  const selectedRoomIds = values.selectedRoomIds
  const primaryRoom = selectedRooms[0]

  const roomOccupancy = new Map<number, string[]>()
  if (values.startDate && values.startTime && values.endTime) {
    for (const room of rooms) {
      const conflicts = findRoomConflicts(
        bookings,
        room.crescatRoomId,
        values.startDate,
        values.startTime,
        values.endDate || values.startDate,
        values.endTime,
      )
      if (conflicts.length > 0) roomOccupancy.set(room.crescatRoomId, conflicts)
    }
  }

  const hasConflict =
    !!values.startDate && selectedRoomIds.some(id => roomOccupancy.has(id))

  const occupiedRanges = occupiedMinuteRanges(
    bookings,
    selectedRoomIds,
    values.startDate,
    values.endDate,
  )

  const slotWithinHours = (() => {
    const hasConfiguredHours =
      hasOpeningHoursRows(openingHours) ||
      hasOpeningHoursRows(primaryRoom?.openingHours ?? null)
    if (
      !hasConfiguredHours ||
      !values.startDate ||
      !values.startTime ||
      !values.endTime
    ) {
      return !hasConfiguredHours
    }
    return isSlotAllowedForCombinedHours(
      values.startDate,
      values.startTime,
      durationHoursBetween(values.startTime, values.endTime),
      openingHours,
      primaryRoom?.openingHours ?? null,
      closedDates,
      vacationMode,
    )
  })()

  const schemaIssues = collectBookingSchemaIssues(
    errorMap.onChange ?? errorMap.onSubmit,
  )
  const validationErrors = [
    ...schemaIssues.map(issue => ({
      fieldId: bookingFieldId(issue.path, fieldIds),
      message: issue.message,
    })),
    ...getBookingAvailabilityErrors({
      hasConflict,
      slotWithinHours,
      startDate: values.startDate,
      startDateId: fieldIds.startDate,
    }),
  ]
  const { visibleErrors, markSubmitAttempt, errorFor } =
    useFormErrors(validationErrors)

  const hasStartedRef = useRef(false)
  const markStarted = () => {
    if (hasStartedRef.current) return
    hasStartedRef.current = true
    posthog.capture("room_booking_started", {
      room_ids: selectedRoomIds,
    })
  }

  if (isSubmitSuccessful) {
    return (
      <Alert className="max-w-2xl p-8" variant="success">
        <AlertTitle>Forespørsel mottatt!</AlertTitle>
        <AlertDescription>
          Takk for din bookingforespørsel. Vi behandler den så fort vi kan og
          tar kontakt på e-post.
        </AlertDescription>
        <Link
          className="col-start-2 inline-flex font-heading uppercase tracking-widest text-success-foreground underline underline-offset-4 focus-brutal"
          href="/rom"
        >
          Tilbake til rom
        </Link>
      </Alert>
    )
  }

  const hasTivoli = selectedRoomIds.includes(TIVOLI_CRESCAT_ROOM_ID)

  return (
    <BookingFormContext.Provider
      value={form as unknown as AppFormApi<BookingFormValues>}
    >
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <form
          className="min-w-0 space-y-14"
          noValidate
          onFocusCapture={markStarted}
          onSubmit={(e: FormEvent) => {
            e.preventDefault()
            markSubmitAttempt()
            form.setErrorMap({ onServer: undefined })
            if (hasConflict || (!slotWithinHours && values.startDate)) return
            void form.handleSubmit().catch(() => {
              if (form.state.errorMap.onServer) return
              form.setErrorMap({ onServer: GENERIC_SUBMIT_ERROR as never })
              posthog.captureException(
                new Error("Unexpected room booking submission failure"),
                {
                  form_id: "room_booking",
                  validation_stage: "client",
                  failure_branch: "unexpected_submission_failure",
                },
              )
            })
          }}
        >
          <BookingFormBookerTypeSection
            studentOrgNameError={errorFor(fieldIds.studentOrgName)}
            studentOrgNameId={fieldIds.studentOrgName}
          />
          <BookingFormScheduleSection
            rooms={rooms}
            roomOccupancy={roomOccupancy}
            occupiedRanges={occupiedRanges}
            openingHours={openingHours}
            closedDates={closedDates}
            vacationMode={vacationMode}
            startDateError={
              errorFor(fieldIds.startDate) ??
              errorFor(`${fieldIds.startDate}-time`)
            }
            startDateId={fieldIds.startDate}
          />
          {!hasConflict && (
            <>
              <BookingFormEventDetailsSection
                audienceCountError={errorFor(fieldIds.audienceCount)}
                audienceCountId={fieldIds.audienceCount}
                closedDates={closedDates}
                eventNameError={errorFor(fieldIds.eventName)}
                eventNameId={fieldIds.eventName}
                openingHours={openingHours}
                roomOpeningHours={primaryRoom?.openingHours ?? null}
                vacationMode={vacationMode}
              />
              <BookingFormTicketSection
                ticketsError={errorFor(fieldIds.tickets)}
                ticketsId={fieldIds.tickets}
              />
              <BookingFormContactSection
                contactEmailError={errorFor(fieldIds.contactEmail)}
                contactEmailId={fieldIds.contactEmail}
                contactNameError={errorFor(fieldIds.contactName)}
                contactNameId={fieldIds.contactName}
                invoiceAddressError={errorFor(fieldIds.invoiceAddress)}
                invoiceAddressId={fieldIds.invoiceAddress}
                orgNumberError={errorFor(fieldIds.orgNumber)}
                orgNumberId={fieldIds.orgNumber}
              />
              <BookingFormNeedsSection
                furnitureError={errorFor(fieldIds.furniture)}
                furnitureId={fieldIds.furniture}
                selectedRoomCrescatId={
                  hasTivoli ? 95 : (selectedRoomIds[0] ?? 0)
                }
              />
              <BookingFormCateringBarSection />
              <BookingPromotionSection
                error={errorFor(fieldIds.promote)}
                errorId={fieldIds.promote}
              />
              <BookingFormTermsSection
                acceptTermsError={errorFor(fieldIds.acceptTerms)}
                acceptTermsId={fieldIds.acceptTerms}
                cancellationTermsContent={cancellationTermsContent}
                rentalTermsContent={rentalTermsContent}
              />

              {/* Honeypot */}
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

              <section className="space-y-4 border-t-2 border-border pt-8">
                {!slotWithinHours && values.startDate && (
                  <Alert className="max-w-3xl" variant="destructive">
                    <AlertTitle>Utenfor åpningstid</AlertTitle>
                    <AlertDescription>
                      Valgt start- eller sluttid er utenfor husets åpningstider
                      for denne dagen.
                    </AlertDescription>
                  </Alert>
                )}
                <Button
                  className="w-full sm:w-auto"
                  disabled={isSubmitting}
                  size="lg"
                  type="submit"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 aria-hidden className="animate-spin" />
                      Sender inn...
                    </>
                  ) : (
                    <>
                      <ArrowRight aria-hidden />
                      Send bookingforespørsel
                    </>
                  )}
                </Button>
                {visibleErrors.length > 0 && (
                  <ErrorSummary className="max-w-3xl" errors={visibleErrors} />
                )}
                {submitError && (
                  <Alert className="max-w-3xl" variant="destructive">
                    <X
                      aria-hidden
                      className="mt-0.5 size-4 shrink-0 text-destructive"
                    />
                    <AlertTitle>Det oppstod en feil</AlertTitle>
                    <AlertDescription>{String(submitError)}</AlertDescription>
                  </Alert>
                )}
              </section>
            </>
          )}
        </form>

        <div className="space-y-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
          <form.Subscribe selector={s => s.values}>
            {values => (
              <BookingFormOrderSummary
                closedDates={closedDates}
                openingHours={openingHours}
                vacationMode={vacationMode}
                rooms={rooms}
                selectedRoomIds={values.selectedRoomIds}
                state={values}
              />
            )}
          </form.Subscribe>
        </div>
      </div>
    </BookingFormContext.Provider>
  )
}

type BookingSchemaIssue = {
  path: string
  message: string
}

function collectBookingSchemaIssues(errorMap: unknown): BookingSchemaIssue[] {
  if (!errorMap || typeof errorMap !== "object") return []

  const issues: BookingSchemaIssue[] = []
  const seen = new Set<string>()
  for (const [path, value] of Object.entries(
    errorMap as Record<string, unknown>,
  )) {
    if (!Array.isArray(value)) continue
    for (const issue of value) {
      if (!issue || typeof issue !== "object") continue
      const message = (issue as { message?: unknown }).message
      if (typeof message !== "string") continue
      const key = `${path}:${message}`
      if (seen.has(key)) continue
      seen.add(key)
      issues.push({ path, message })
    }
  }
  return issues
}

function bookingFieldId(
  path: string,
  fieldIds: Record<string, string>,
): string {
  if (
    path === "selectedRoomIds" ||
    path === "startDate" ||
    path === "endDate" ||
    path === "startTime" ||
    path === "endTime" ||
    path.startsWith("doorsTimes") ||
    path.startsWith("estimatedEndTimes")
  ) {
    return path === "startTime" || path === "endTime"
      ? `${fieldIds.startDate}-time`
      : fieldIds.startDate
  }
  if (path === "studentOrgName") return fieldIds.studentOrgName
  if (path === "eventName") return fieldIds.eventName
  if (path === "audienceCount") return fieldIds.audienceCount
  if (path === "ticketTypes" || path.startsWith("ticketTypes[")) {
    return fieldIds.tickets
  }
  if (path === "furniture") return fieldIds.furniture
  if (path === "contactName") return fieldIds.contactName
  if (path === "contactEmail") return fieldIds.contactEmail
  if (path === "invoiceAddress") return fieldIds.invoiceAddress
  if (path === "orgNumber") return fieldIds.orgNumber
  if (path === "acceptTerms") return fieldIds.acceptTerms
  if (path === "promote") return fieldIds.promote
  return fieldIds.startDate
}

function getBookingAvailabilityErrors({
  hasConflict,
  slotWithinHours,
  startDate,
  startDateId,
}: {
  hasConflict: boolean
  slotWithinHours: boolean
  startDate: string
  startDateId: string
}): ErrorSummaryItem[] {
  const errors: ErrorSummaryItem[] = []
  if (hasConflict) {
    errors.push({
      fieldId: `${startDateId}-time`,
      message: "Velg et tidsrom som ikke overlapper en eksisterende booking.",
    })
  }
  if (!slotWithinHours && startDate) {
    errors.push({
      fieldId: `${startDateId}-time`,
      message: "Velg et tidsrom innenfor åpningstiden.",
    })
  }
  return errors
}
