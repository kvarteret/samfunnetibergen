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
} from "@/lib/opening-hours"
import { useFormErrors } from "@/lib/use-form-errors"
import { fetchBookableRoomsForBooker } from "../actions/bookable-rooms"
import { fetchRoomAvailability } from "../actions/room-availability"
import { submitRoomBooking } from "../actions/submit-room-booking"
import {
  durationHoursBetween,
  findRoomConflict,
  overlaps,
  slotRangeMs,
} from "../domain/availability"
import {
  buildBookingPayload,
  initialBookingState,
  isExternalBooker,
} from "../domain/formState"
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
import { BookingFormContext } from "./bookingFormContext"

// TODO: resolve form type when @tanstack/react-form stabilizes
export type BookingFormValues = typeof initialBookingState

const DATE_COUNT = 7
const TIVOLI_CRESCAT_ROOM_ID = 95

interface BookingFormProps {
  initialRooms: BookingRoom[]
  initialRoomId?: number
  openingHours: OpeningHours | null
  closedDates: ClosedDate[]
}

export function BookingForm({
  initialRooms,
  initialRoomId,
  openingHours,
  closedDates,
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
    furniture: `${uid}-furniture`,
    contactName: `${uid}-contactName`,
    contactEmail: `${uid}-contactEmail`,
    invoiceAddress: `${uid}-invoiceAddress`,
    acceptTerms: `${uid}-acceptTerms`,
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
    onSubmit: async ({ value }) => {
      const selectedRooms = rooms.filter(r =>
        value.selectedRoomIds.includes(r.crescatRoomId),
      )
      if (!selectedRooms.length) throw new Error("Ingen rom valgt")
      const result = await submitRoomBooking({
        ...buildBookingPayload(value, selectedRooms),
        honeypot,
      })
      if (!result.ok) throw new Error(result.error)
    },
  })

  const values = useStore(form.store, state => state.values)
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

  useEffect(() => {
    let active = true
    fetchRoomAvailability(
      bookerType,
      today,
      addDaysDateOnly(today, DATE_COUNT),
    ).then(result => {
      if (active) setBookings(result)
    })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookerType])

  const selectedRoomIds = values.selectedRoomIds
  const primaryRoom = selectedRooms[0]

  const roomBookings = primaryRoom
    ? bookings.filter(b => b.resourceId === primaryRoom.crescatRoomId)
    : []

  const selectedDateRoomBookings = values.startDate
    ? roomBookings.filter(booking =>
        overlaps(...slotRangeMs(values.startDate, "00:00", "00:00"), booking),
      )
    : []

  const hasConflict =
    !!values.startDate &&
    selectedDateRoomBookings.length > 0 &&
    selectedDateRoomBookings.some(b =>
      overlaps(
        ...slotRangeMs(values.startDate, values.startTime, values.endTime),
        b,
      ),
    )

  const roomOccupancy = new Map<number, string>()
  if (values.startDate && values.startTime && values.endTime) {
    for (const room of rooms) {
      const conflict = findRoomConflict(
        bookings,
        room.crescatRoomId,
        values.startDate,
        values.startTime,
        values.endTime,
      )
      if (conflict) roomOccupancy.set(room.crescatRoomId, conflict)
    }
  }

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
    )
  })()

  const validationErrors = getBookingValidationErrors({
    values,
    fieldIds,
    roomsSelected: selectedRoomIds.length > 0,
    hasConflict,
    slotWithinHours,
  })
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

  if (form.state.isSubmitSuccessful) {
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

  const submitError = form.state.errorMap.onSubmit
  const hasTivoli = selectedRoomIds.includes(TIVOLI_CRESCAT_ROOM_ID)

  return (
    <BookingFormContext.Provider value={form}>
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <form
          className="min-w-0 space-y-14"
          noValidate
          onFocusCapture={markStarted}
          onSubmit={(e: FormEvent) => {
            e.preventDefault()
            markSubmitAttempt()
            if (validationErrors.length > 0) return
            form.handleSubmit()
          }}
        >
          {visibleErrors.length > 0 && (
            <ErrorSummary className="max-w-3xl" errors={visibleErrors} />
          )}
          <BookingFormBookerTypeSection
            studentOrgNameError={errorFor(fieldIds.studentOrgName)}
            studentOrgNameId={fieldIds.studentOrgName}
          />
          <BookingFormScheduleSection
            rooms={rooms}
            selectedRoomIds={selectedRoomIds}
            roomOccupancy={roomOccupancy}
            openingHours={openingHours}
            closedDates={closedDates}
            hasConflict={hasConflict}
            startDateError={
              errorFor(fieldIds.startDate) ??
              errorFor(`${fieldIds.startDate}-time`)
            }
            startDateId={fieldIds.startDate}
          />
          <BookingFormEventDetailsSection
            audienceCountError={errorFor(fieldIds.audienceCount)}
            audienceCountId={fieldIds.audienceCount}
            eventNameError={errorFor(fieldIds.eventName)}
            eventNameId={fieldIds.eventName}
          />
          <BookingFormTicketSection />
          <BookingFormContactSection
            contactEmailError={errorFor(fieldIds.contactEmail)}
            contactEmailId={fieldIds.contactEmail}
            contactNameError={errorFor(fieldIds.contactName)}
            contactNameId={fieldIds.contactName}
            invoiceAddressError={errorFor(fieldIds.invoiceAddress)}
            invoiceAddressId={fieldIds.invoiceAddress}
          />
          <BookingFormNeedsSection
            furnitureError={errorFor(fieldIds.furniture)}
            furnitureId={fieldIds.furniture}
            selectedRoomCrescatId={hasTivoli ? 95 : (selectedRoomIds[0] ?? 0)}
          />
          <BookingFormCateringBarSection />
          <BookingFormTermsSection
            acceptTermsError={errorFor(fieldIds.acceptTerms)}
            acceptTermsId={fieldIds.acceptTerms}
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
                  Valgt start- eller sluttid er utenfor husets åpningstider for
                  denne dagen.
                </AlertDescription>
              </Alert>
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
            <Button
              className="w-full sm:w-auto"
              disabled={form.state.isSubmitting}
              size="lg"
              type="submit"
            >
              {form.state.isSubmitting ? (
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
          </section>
        </form>

        <div className="order-first space-y-6 lg:order-none lg:sticky lg:top-24">
          <form.Subscribe selector={s => s.values}>
            {values => (
              <BookingFormOrderSummary
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

interface BookingValidationOptions {
  values: BookingFormValues
  fieldIds: Record<
    | "studentOrgName"
    | "startDate"
    | "eventName"
    | "audienceCount"
    | "furniture"
    | "contactName"
    | "contactEmail"
    | "invoiceAddress"
    | "acceptTerms",
    string
  >
  roomsSelected: boolean
  hasConflict: boolean
  slotWithinHours: boolean
}

function getBookingValidationErrors({
  values,
  fieldIds,
  roomsSelected,
  hasConflict,
  slotWithinHours,
}: BookingValidationOptions): ErrorSummaryItem[] {
  const errors: ErrorSummaryItem[] = []
  const isExternal = isExternalBooker(values.bookerType)

  if (!roomsSelected) {
    errors.push({
      fieldId: fieldIds.startDate,
      message: "Velg minst ett rom.",
    })
  }
  if (values.bookerType === "studentorg" && !values.studentOrgName.trim()) {
    errors.push({
      fieldId: fieldIds.studentOrgName,
      message: "Skriv inn navn på studentorganisasjonen.",
    })
  }
  if (!values.startDate) {
    errors.push({
      fieldId: fieldIds.startDate,
      message: "Velg dato.",
    })
  }
  if (hasConflict) {
    errors.push({
      fieldId: `${fieldIds.startDate}-time`,
      message: "Velg et tidsrom som ikke overlapper en eksisterende booking.",
    })
  }
  if (!slotWithinHours && values.startDate) {
    errors.push({
      fieldId: `${fieldIds.startDate}-time`,
      message: "Velg et tidsrom innenfor åpningstiden.",
    })
  }
  if (!values.eventName.trim()) {
    errors.push({
      fieldId: fieldIds.eventName,
      message: "Skriv inn navn på arrangementet.",
    })
  }
  if (!values.audienceCount.trim()) {
    errors.push({
      fieldId: fieldIds.audienceCount,
      message: "Skriv inn estimert antall publikum.",
    })
  }
  if (!values.furniture.trim()) {
    errors.push({
      fieldId: fieldIds.furniture,
      message: "Skriv inn ønsket møblement.",
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
  if (isExternal && !values.invoiceAddress.trim()) {
    errors.push({
      fieldId: fieldIds.invoiceAddress,
      message: "Skriv inn fakturaadresse.",
    })
  }
  if (!values.acceptTerms) {
    errors.push({
      fieldId: fieldIds.acceptTerms,
      message: "Bekreft at du har lest og godtar bookingvilkårene.",
    })
  }

  return errors
}
