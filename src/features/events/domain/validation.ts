// Single source of truth for event-submission validation, shared by the client
// form (EventForm) and the server action (submitEvent). Keeping the rules here
// stops the two sides from diverging — notably the rrule-when-recurring rule,
// which the client previously did not enforce.

export const EVENT_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEventDateString(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false
  const d = new Date(`${dateStr}T00:00:00Z`)
  return !Number.isNaN(d.getTime())
}

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

// The minimal slice both FormState and SubmitEventInput can satisfy.
export interface EventValidationSubject {
  title: string
  dates: { startDate: string }[]
  submittedBy: string
  submittedByEmail: string
  isRecurring: boolean
  rrule: string
}

export function getEventValidationIssues(
  subject: EventValidationSubject,
): EventValidationIssue[] {
  const issues: EventValidationIssue[] = []

  if (!subject.title.trim()) {
    issues.push({ field: "title", message: "Skriv inn tittel." })
  }

  const hasValidDate = subject.dates.some(
    date => date.startDate && isValidEventDateString(date.startDate),
  )
  if (!hasValidDate) {
    issues.push({ field: "firstDate", message: "Fyll ut minst én gyldig dato." })
  }

  if (!subject.submittedBy.trim()) {
    issues.push({
      field: "submittedBy",
      message: "Skriv inn navn på kontaktperson.",
    })
  }

  if (
    !subject.submittedByEmail.trim() ||
    !EVENT_EMAIL_RE.test(subject.submittedByEmail.trim())
  ) {
    issues.push({
      field: "submittedByEmail",
      message: "Skriv inn en gyldig e-postadresse.",
    })
  }

  if (subject.isRecurring && !subject.rrule.trim()) {
    issues.push({
      field: "rrule",
      message: "Velg et gjentakelsesmønster for det gjentagende arrangementet.",
    })
  }

  return issues
}
