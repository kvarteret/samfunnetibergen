import type { PublicOccurrence } from "../domain/public-events"

export type BroadcastReadinessErrorCode =
  | "missing_title"
  | "missing_start_time"
  | "missing_end_time"
  | "missing_image"
  | "missing_keyword"
  | "missing_ticket_url"
  | "unmapped_location"

export type BroadcastReadinessInfoCode = "duplicate_ticket_url"

export type BroadcastReadiness = {
  occurrenceId: string
  websiteUrl: string
  ready: boolean
  issues: BroadcastReadinessErrorCode[]
  info: BroadcastReadinessInfoCode[]
}

export type BroadcastReadinessOptions = {
  siteUrl: string
  locale: "nb" | "en"
}

const MISSING_TITLE = "[Mangler arrangementstittel]"

function websiteUrl(
  occurrence: PublicOccurrence,
  { siteUrl, locale }: BroadcastReadinessOptions,
): string {
  return `${siteUrl.replace(/\/+$/, "")}/${locale}/arrangementer/${encodeURIComponent(occurrence.event.slug)}`
}

function hasKeyword(occurrence: PublicOccurrence): boolean {
  const { event } = occurrence
  return Boolean(
    event.eventType?.taxonomyGroup?.name?.trim() ||
      event.eventType?.name?.trim(),
  )
}

/**
 * Assess one public occurrence without making external requests or writing
 * content. Duplicate ticket URLs are attached later by the audit over the
 * complete occurrence set, because they are useful information, not errors.
 */
export function assessBroadcastReadiness(
  occurrence: PublicOccurrence,
  options: BroadcastReadinessOptions,
): BroadcastReadiness {
  const { event, schedule } = occurrence
  const issues: BroadcastReadinessErrorCode[] = []

  if (!event.title.trim() || event.title === MISSING_TITLE) {
    issues.push("missing_title")
  }
  if (!schedule.startsAt) issues.push("missing_start_time")
  if (!schedule.endsAt) issues.push("missing_end_time")
  if (!event.imageUrl) issues.push("missing_image")
  if (!hasKeyword(occurrence)) issues.push("missing_keyword")
  if (!event.ticketUrl) issues.push("missing_ticket_url")
  if (!event.room) issues.push("unmapped_location")

  return {
    occurrenceId: occurrence.id,
    websiteUrl: websiteUrl(occurrence, options),
    ready: issues.length === 0,
    issues,
    info: [],
  }
}

/** Mark repeated commerce URLs without collapsing occurrence identities. */
export function addDuplicateTicketUrlInfo(
  occurrences: readonly PublicOccurrence[],
  readiness: readonly BroadcastReadiness[],
): BroadcastReadiness[] {
  const counts = new Map<string, number>()
  for (const occurrence of occurrences) {
    const ticketUrl = occurrence.event.ticketUrl
    if (ticketUrl) counts.set(ticketUrl, (counts.get(ticketUrl) ?? 0) + 1)
  }

  const occurrenceById = new Map(
    occurrences.map(occurrence => [occurrence.id, occurrence]),
  )
  return readiness.map(result => {
    const ticketUrl = occurrenceById.get(result.occurrenceId)?.event.ticketUrl
    return ticketUrl && (counts.get(ticketUrl) ?? 0) > 1
      ? { ...result, info: ["duplicate_ticket_url"] }
      : result
  })
}
