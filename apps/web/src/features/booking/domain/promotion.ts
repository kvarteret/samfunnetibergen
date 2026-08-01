import type { FormState as EventFormState } from "@/features/events/domain/formState"
import { getEventValidationIssues } from "@/features/events/domain/validation"
import type { BookingFormState } from "./formState"

// Placeholder field ids returned by getPromotionValidationMessages. The booking
// form maps these to the real DOM ids it generates with useId, so the shared
// ErrorSummary and the inline section errors line up.
export const PROMOTE_FIELD = "promote"
export const PROMO_TITLE_FIELD = "promote-title"
export const PROMO_FIRST_DATE_FIELD = "promote-first-date"
export const PROMO_SUBMITTER_FIELD = "promote-submitter"
export const PROMO_SUBMITTER_EMAIL_FIELD = "promote-submitter-email"
export const PROMO_IMAGE_FIELD = "promote-image"

type BookingPrefillSubset = Pick<
  BookingFormState,
  | "eventName"
  | "startDate"
  | "endDate"
  | "startTime"
  | "doorsTimes"
  | "freeOrPaid"
  | "contactName"
  | "contactEmail"
>

// Seeds the embedded event form from what the guest already typed into the
// booking: title from the event name, start time from the first day's "Dører
// åpner" (doorsTimes[0]) when set otherwise the booking start time, the first
// date from the booking date, and free/paid from the booking. Pure: never
// mutates its inputs.
export function buildPromotionDefaults(
  booking: BookingPrefillSubset,
  base: EventFormState,
): EventFormState {
  const startTime = booking.doorsTimes[0] || booking.startTime
  const [firstDate, ...restDates] = base.dates

  const dates = firstDate
    ? [
        {
          ...firstDate,
          startDate: booking.startDate,
          startTime,
        },
        ...restDates,
      ]
    : base.dates

  return {
    ...base,
    title: booking.eventName,
    isFree: booking.freeOrPaid === "Gratis",
    submittedBy: booking.contactName || "",
    submittedByEmail: booking.contactEmail || "",
    dates,
  }
}

// The time to apply to the event's first date when the guest clicks
// "Samme som booking" (used when no doors time is available to prefill).
export function bookingStartTime(
  booking: Pick<BookingFormState, "startTime">,
): string {
  return booking.startTime
}

export interface PromotionValidationMessage {
  fieldId: string
  message: string
}

export interface PromotionValidationInput {
  promote: BookingFormState["promote"]
  event: EventFormState
  hasImageFile: boolean
  uploadLater: boolean
}

const EVENT_ISSUE_FIELD_TO_PROMO: Record<string, string> = {
  title: PROMO_TITLE_FIELD,
  firstDate: PROMO_FIRST_DATE_FIELD,
  submittedBy: PROMO_SUBMITTER_FIELD,
  submittedByEmail: PROMO_SUBMITTER_EMAIL_FIELD,
}

// Gates the booking submit on the promotion choice. Returns user-facing
// Norwegian messages for anything wrong, or [] when the booking may proceed.
// When the guest declines promotion ("nei") there is nothing to validate.
export function getPromotionValidationMessages(
  input: PromotionValidationInput,
): PromotionValidationMessage[] {
  if (input.promote === "") {
    return [
      {
        fieldId: PROMOTE_FIELD,
        message: "Velg om du vil promotere arrangementet.",
      },
    ]
  }

  if (input.promote === "nei") {
    return []
  }

  const messages: PromotionValidationMessage[] = []

  const issues = getEventValidationIssues({
    title: input.event.title,
    dates: input.event.dates,
    submittedBy: input.event.submittedBy,
    submittedByEmail: input.event.submittedByEmail,
    // Recurrence is not offered in the booking flow, so it is always inert.
    isRecurring: false,
    rrule: "",
  })

  for (const issue of issues) {
    messages.push({
      fieldId: EVENT_ISSUE_FIELD_TO_PROMO[issue.field] ?? PROMO_TITLE_FIELD,
      message: issue.message,
    })
  }

  if (!input.hasImageFile && !input.uploadLater) {
    messages.push({
      fieldId: PROMO_IMAGE_FIELD,
      message:
        "Last opp et bilde, eller huk av for at du laster opp bilde senere.",
    })
  }

  return messages
}
