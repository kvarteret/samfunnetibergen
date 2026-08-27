import { eventFormSchema, isValidEventDateString } from "./eventFormSchema"

export const EVENT_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export { isValidEventDateString }

export type EventValidationField =
  | "title"
  | "firstDate"
  | "submittedBy"
  | "submittedByEmail"
  | "rrule"

export interface EventValidationIssue {
  field: EventValidationField
  message: string
}

// The minimal slice both the promotion flow and legacy callers can satisfy.
// The actual rules live in eventFormSchema; this adapter only projects its
// issues onto the older field names used by the embedded promotion flow.
export interface EventValidationSubject {
  title: string
  dates: { startDate: string; startTime?: string; endTime?: string }[]
  submittedBy: string
  submittedByEmail: string
  isRecurring: boolean
  rrule: string
}

export function getEventValidationIssues(
  subject: EventValidationSubject,
): EventValidationIssue[] {
  const parsed = eventFormSchema.safeParse({
    title: subject.title,
    titleEnglish: subject.title,
    description: "",
    descriptionEnglish: "",
    dates: subject.dates.map((date, index) => ({
      id: String(index),
      startDate: date.startDate,
      startTime: date.startTime ?? "",
      endTime: date.endTime ?? "",
    })),
    isRecurring: subject.isRecurring,
    rrule: subject.rrule,
    room: "",
    roomText: "",
    roomTextEnglish: "",
    organizerGroup: "",
    organizerText: "",
    organizerTextEnglish: "",
    submittedByOrganization: "",
    eventTypeId: "",
    isInternalEvent: false,
    isFree: false,
    priceOrdinar: "",
    priceStudent: "",
    priceMedlem: "",
    ticketUrl: "",
    facebookUrl: "",
    submittedBy: subject.submittedBy,
    submittedByEmail: subject.submittedByEmail,
  })

  if (parsed.success) return []

  const issues: EventValidationIssue[] = []
  const seen = new Set<string>()
  for (const issue of parsed.error.issues) {
    const field = eventValidationField(issue.path)
    if (!field) continue
    const key = `${field}:${issue.message}`
    if (seen.has(key)) continue
    seen.add(key)
    issues.push({ field, message: issue.message })
  }
  return issues
}

function eventValidationField(
  path: readonly PropertyKey[],
): EventValidationField | undefined {
  const [first] = path
  if (first === "title") return "title"
  if (first === "dates") return "firstDate"
  if (first === "submittedBy") return "submittedBy"
  if (first === "submittedByEmail") return "submittedByEmail"
  if (first === "rrule") return "rrule"
  return undefined
}
