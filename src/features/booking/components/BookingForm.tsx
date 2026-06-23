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
import { submitPromotionEvent } from "@/features/events/actions/submitPromotionEvent"
import {
  type FormState as EventFormState,
  initialState as eventInitialState,
} from "@/features/events/domain/formState"
import {
  eventTypeOptions,
  groupOptions,
  roomOptions,
} from "@/features/events/domain/options"
import { useEventImage } from "@/features/events/domain/useEventImage"
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
import type { EventGroup, EventRoom, EventType } from "@/lib/sanity/fetch"
import { useFormErrors } from "@/lib/use-form-errors"
import { fetchBookableRoomsForBooker } from "../actions/bookable-rooms"
import { fetchRoomAvailability } from "../actions/room-availability"
import { submitRoomBooking } from "../actions/submit-room-booking"
import {
  durationHoursBetween,
  findRoomConflicts,
  occupiedMinuteRanges,
} from "../domain/availability"
import {
  buildBookingPayload,
  initialBookingState,
  isExternalBooker,
} from "../domain/formState"
import {
  bookingStartTime,
  buildPromotionDefaults,
  getPromotionValidationMessages,
  PROMO_FIRST_DATE_FIELD,
  PROMO_IMAGE_FIELD,
  PROMO_SUBMITTER_EMAIL_FIELD,
  PROMO_SUBMITTER_FIELD,
  PROMO_TITLE_FIELD,
  PROMOTE_FIELD,
} from "../domain/promotion"
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

// TODO: resolve form type when @tanstack/react-form stabilizes
export type BookingFormValues = typeof initialBookingState

const DATE_COUNT = 7
const TIVOLI_CRESCAT_ROOM_ID = 95

interface BookingFormProps {
  initialRooms: BookingRoom[]
  initialRoomId?: number
  openingHours: OpeningHours | null
  closedDates: ClosedDate[]
  eventRooms: EventRoom[]
  eventTypes: EventType[]
  eventGroups: EventGroup[]
}

export function BookingForm({
  initialRooms,
  initialRoomId,
  openingHours,
  closedDates,
  eventRooms,
  eventTypes,
  eventGroups,
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
  const promoteFieldIds = {
    promote: `${uid}-promote`,
    title: `${uid}-promote-title`,
    firstDate: `${uid}-promote-first-date`,
    submittedBy: `${uid}-promote-submitter`,
    submittedByEmail: `${uid}-promote-submitter-email`,
  }
  const promoFieldByPlaceholder: Record<string, string> = {
    [PROMOTE_FIELD]: promoteFieldIds.promote,
    [PROMO_TITLE_FIELD]: promoteFieldIds.title,
    [PROMO_FIRST_DATE_FIELD]: promoteFieldIds.firstDate,
    [PROMO_SUBMITTER_FIELD]: promoteFieldIds.submittedBy,
    [PROMO_SUBMITTER_EMAIL_FIELD]: promoteFieldIds.submittedByEmail,
    [PROMO_IMAGE_FIELD]: promoteFieldIds.promote,
  }

  const eventTypeSelectOptions = eventTypeOptions(eventTypes)
  const roomSelectOptions = roomOptions(eventRooms)
  const groupSelectOptions = groupOptions(eventGroups)

  const image = useEventImage()
  const [uploadLater, setUploadLater] = useState(false)
  const [promotionError, setPromotionError] = useState<string | null>(null)

  const promotionForm = useForm({
    defaultValues: eventInitialState as EventFormState,
  })
  const promotionValues = useStore(promotionForm.store, state => state.values)

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

      posthog.capture("room_booking_submitted", {
        promote: value.promote === "ja",
      })

      // The booking is the primary action; once it succeeds we never fail the
      // whole submit because the optional promotion could not be created. A
      // promotion error becomes a non-blocking warning on the success screen.
      if (value.promote === "ja") {
        setPromotionError(null)
        const promoResult = await submitPromotionEvent(
          promotionForm.state.values,
          image.imageFile,
        )
        if (!promoResult.ok) {
          posthog.capture("room_booking_promotion_event_failed", {
            error: promoResult.error,
          })
          setPromotionError(
            "Bookingen er sendt, men promoteringen kunne ikke opprettes. Ta kontakt med pr@kvarteret.no.",
          )
        } else {
          posthog.capture("room_booking_promotion_event_created", {
            has_image: Boolean(image.imageFile),
            upload_later: uploadLater,
          })
        }
      }
    },
  })
  const values = useStore(form.store, state => state.values)
  const isSubmitting = useStore(form.store, state => state.isSubmitting)
  const isSubmitSuccessful = useStore(
    form.store,
    state => state.isSubmitSuccessful,
  )
  const submitError = useStore(form.store, state => state.errorMap.onSubmit)
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

  // Seed the embedded event form once, the first time the guest opts in, from
  // what they already typed into the booking. Seeding once avoids clobbering
  // edits if they toggle the choice off and on again.
  const hasSeededPromotionRef = useRef(false)
  useEffect(() => {
    if (values.promote !== "ja" || hasSeededPromotionRef.current) return
    hasSeededPromotionRef.current = true
    posthog.capture("room_booking_promotion_opted_in")
    const defaults = buildPromotionDefaults(values, promotionForm.state.values)
    promotionForm.setFieldValue("title", defaults.title)
    promotionForm.setFieldValue("isFree", defaults.isFree)
    promotionForm.setFieldValue("dates", defaults.dates)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.promote])

  const showDoorsHint = values.doorsTimes.some(Boolean)
  const onSameAsBooking = () => {
    const time = bookingStartTime(values)
    promotionForm.setFieldValue("dates", (dates: EventFormState["dates"]) =>
      dates.map((date, index) => {
        if (index === 0) {
          return {
            ...date,
            startDate: date.startDate || values.startDate,
            startTime: time,
            endTime: values.endTime || date.endTime,
          }
        }
        return date
      }),
    )
  }

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
    )
  })()

  const bookingValidationErrors = getBookingValidationErrors({
    values,
    fieldIds,
    roomsSelected: selectedRoomIds.length > 0,
    hasConflict,
    slotWithinHours,
  })
  const promotionValidationErrors = getPromotionValidationMessages({
    promote: values.promote,
    event: promotionValues,
    hasImageFile: Boolean(image.imageFile),
    uploadLater,
  }).map(message => ({
    fieldId: promoFieldByPlaceholder[message.fieldId] ?? message.fieldId,
    message: message.message,
  }))
  const validationErrors = [
    ...bookingValidationErrors,
    ...promotionValidationErrors,
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
          {values.promote === "ja" && !promotionError && (
            <> Arrangementet er sendt til godkjenning hos PR-gruppen.</>
          )}
        </AlertDescription>
        {promotionError && (
          <AlertDescription className="text-destructive">
            {promotionError}
          </AlertDescription>
        )}
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
            occupiedRanges={occupiedRanges}
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
          <BookingPromotionSection
            eventTypeOptions={eventTypeSelectOptions}
            firstDateError={errorFor(promoteFieldIds.firstDate)}
            firstDateId={promoteFieldIds.firstDate}
            groupOptions={groupSelectOptions}
            image={image}
            onSameAsBooking={onSameAsBooking}
            onUploadLaterChange={setUploadLater}
            promoteError={errorFor(promoteFieldIds.promote)}
            promoteFieldId={promoteFieldIds.promote}
            promotionForm={promotionForm}
            roomOptions={roomSelectOptions}
            showDoorsHint={showDoorsHint}
            submittedByEmailError={errorFor(promoteFieldIds.submittedByEmail)}
            submittedByEmailId={promoteFieldIds.submittedByEmail}
            submittedByError={errorFor(promoteFieldIds.submittedBy)}
            submittedById={promoteFieldIds.submittedBy}
            titleError={errorFor(promoteFieldIds.title)}
            titleId={promoteFieldIds.title}
            uploadLater={uploadLater}
          />
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

// Creates the pending event when the guest opted into promotion. Mirrors the
// standalone event form's submit: upload the image (if any) only now, then write
// the arrangement. Throws on failure so the caller can surface a warning without
// failing the already-sent booking.
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
