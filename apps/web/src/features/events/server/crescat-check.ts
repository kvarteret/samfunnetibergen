import {
  type CrescatCheckDate,
  type CrescatCheckDocument,
  type CrescatCheckMatch,
  type CrescatCheckStatus,
  crescatCheckFingerprint,
  crescatCheckId,
  overallCrescatStatus,
} from "@samfunnet/content-domain/crescat-check"
import type { SanityClient } from "@sanity/client"
import {
  type CresatBooking,
  fetchVenueCalendar,
  fetchVenueResources,
  ROOM_CALENDAR_SLUGS,
} from "@/lib/integrations/crescat/calendar"
import {
  addDaysDateOnly,
  crescatLocalDateTimeMs,
  toDateTime,
} from "@/lib/integrations/crescat/datetime"
import { titleTokens } from "../integrations/ticketco/rooms"

/**
 * Studio "Requests" are arrangement documents submitted from the website (or
 * imported) and still awaiting approval. Each one should already have a room
 * booking in Crescat; this scan looks for it and records a traffic light.
 */

type Localized = { language?: string; value?: unknown }[] | null

export type CheckableRequest = {
  _id: string
  localizedTitle?: Localized
  localizedOrganizerText?: Localized
  organizerName?: Localized
  submittedByOrganization?: string | null
  room?: { _ref?: string | null } | null
  crescatRoomId?: number | null
  dates?:
    | {
        startDate?: string | null
        startTime?: string | null
        endTime?: string | null
      }[]
    | null
}

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/
const DATE = /^\d{4}-\d{2}-\d{2}$/
const HOUR_MS = 60 * 60 * 1000
/** Share of the requested time a same-room booking must cover to be green. */
const FULL_COVERAGE = 0.75
const MAX_MATCHES = 3

function nb(values: Localized | undefined): string {
  const value = values?.find(item => item.language === "nb")?.value
  return typeof value === "string" ? value : ""
}

function interval(
  date: string,
  startTime?: string | null,
  endTime?: string | null,
): { start: number; end: number; timed: boolean } {
  if (!startTime || !TIME.test(startTime)) {
    // No time: the whole evening-inclusive day can only support "maybe".
    const start = crescatLocalDateTimeMs(toDateTime(date, "00:00"))
    return { start, end: start + 30 * HOUR_MS, timed: false }
  }
  const start = crescatLocalDateTimeMs(toDateTime(date, startTime))
  if (!endTime || !TIME.test(endTime))
    return { start, end: start + 2 * HOUR_MS, timed: true }
  const endDate = endTime <= startTime ? addDaysDateOnly(date, 1) : date
  return {
    start,
    end: crescatLocalDateTimeMs(toDateTime(endDate, endTime)),
    timed: true,
  }
}

type Candidate = {
  booking: CresatBooking
  overlap: number
  coverage: number
  sameRoom: boolean
  sameDay: boolean
  titleHit: boolean
}

export function classifyRequestDate(
  request: CheckableRequest,
  date: {
    startDate: string
    startTime?: string | null
    endTime?: string | null
  },
  bookings: CresatBooking[],
  roomNames: Map<number, string>,
  key: string,
): CrescatCheckDate {
  const wanted = new Set([
    ...titleTokens(nb(request.localizedTitle)),
    ...titleTokens(nb(request.localizedOrganizerText)),
    ...titleTokens(nb(request.organizerName)),
    ...titleTokens(request.submittedByOrganization ?? ""),
  ])
  const window = interval(date.startDate, date.startTime, date.endTime)
  const dayStart = crescatLocalDateTimeMs(toDateTime(date.startDate, "00:00"))
  // Late-night events run into the next morning.
  const dayEnd = dayStart + 30 * HOUR_MS
  const roomId = request.crescatRoomId ?? null

  const candidates: Candidate[] = bookings.flatMap(booking => {
    let start: number
    let end: number
    try {
      start = crescatLocalDateTimeMs(booking.start)
      end = crescatLocalDateTimeMs(booking.end)
    } catch {
      return []
    }
    const sameDay = start < dayEnd && end > dayStart
    if (!sameDay) return []
    const overlap = Math.max(
      0,
      Math.min(end, window.end) - Math.max(start, window.start),
    )
    return [
      {
        booking,
        overlap,
        coverage: overlap / (window.end - window.start),
        sameRoom: roomId !== null && booking.resourceId === roomId,
        sameDay,
        titleHit: [...titleTokens(booking.title ?? "")].some(token =>
          wanted.has(token),
        ),
      },
    ]
  })

  const pick = (
    status: CrescatCheckStatus,
    reason: string,
    chosen: Candidate[],
  ): CrescatCheckDate => {
    const seen = new Set<string>()
    const matches: CrescatCheckMatch[] = []
    for (const { booking } of chosen.sort(
      (a, b) =>
        Number(b.titleHit) - Number(a.titleHit) || b.overlap - a.overlap,
    )) {
      const id = `${booking.event_id}:${booking.resourceId}`
      if (seen.has(id) || matches.length >= MAX_MATCHES) continue
      seen.add(id)
      matches.push({
        title: booking.title?.trim() || "(uten tittel)",
        room: roomNames.get(booking.resourceId) ?? `Rom ${booking.resourceId}`,
        start: booking.start,
        end: booking.end,
      })
    }
    return {
      _key: key,
      date: date.startDate,
      ...(date.startTime ? { startTime: date.startTime } : {}),
      ...(date.endTime ? { endTime: date.endTime } : {}),
      status,
      reason,
      matches,
    }
  }

  const inRoom = candidates.filter(c => c.sameRoom && c.overlap > 0)
  if (window.timed) {
    const green = inRoom.filter(c => c.coverage >= FULL_COVERAGE || c.titleHit)
    if (green.length)
      return pick("found", "Overlappende booking i samme rom", green)
    if (inRoom.length)
      return pick(
        "maybe",
        "Booking i samme rom dekker bare deler av tiden",
        inRoom,
      )
  } else if (inRoom.length) {
    return pick("maybe", "Booking i rommet samme dag (tid mangler)", inRoom)
  }

  const namedNow = candidates.filter(c => c.titleHit && c.overlap > 0)
  if (namedNow.length)
    return pick(
      "maybe",
      roomId === null
        ? "Booking med lignende navn samtidig (rom ikke valgt)"
        : "Booking med lignende navn samtidig, men i et annet rom",
      namedNow,
    )
  const namedToday = candidates.filter(c => c.titleHit)
  if (namedToday.length)
    return pick(
      "maybe",
      "Booking med lignende navn samme dag, men annet tidspunkt",
      namedToday,
    )

  return pick(
    "missing",
    roomId === null
      ? "Ingen rom valgt, og ingen booking med lignende navn"
      : "Ingen booking i rommet på dette tidspunktet",
    [],
  )
}

function checkableDates(request: CheckableRequest) {
  return (request.dates ?? []).filter(
    (date): date is { startDate: string } & typeof date =>
      typeof date.startDate === "string" && DATE.test(date.startDate),
  )
}

export function buildCrescatCheck(
  request: CheckableRequest,
  bookings: CresatBooking[],
  roomNames: Map<number, string>,
  checkedAt: string,
): CrescatCheckDocument | null {
  const dates = checkableDates(request)
  if (!dates.length) return null
  const results = dates.map((date, index) =>
    classifyRequestDate(request, date, bookings, roomNames, `d${index}`),
  )
  const arrangementId = request._id.replace(/^drafts\./, "")
  return {
    _id: crescatCheckId(arrangementId),
    _type: "crescatCheck",
    arrangementId,
    status: overallCrescatStatus(results.map(result => result.status)),
    checkedAt,
    fingerprint: crescatCheckFingerprint(request),
    dates: results,
  }
}

// Mirrors the Studio "Requests" list filter. Version documents belong to
// releases and are not requests in their own right.
const PENDING_REQUESTS = `*[
  _type == "arrangement" &&
  defined(submittedByEmail) &&
  coalesce(approvalStatus, "pending") == "pending" &&
  !(_id in path("versions.**")) &&
  ($ids == null || _id in $ids)
]{
  _id,
  localizedTitle,
  localizedOrganizerText,
  "organizerName": organizerGroup->localizedName,
  submittedByOrganization,
  room,
  "crescatRoomId": room->crescatRoomId,
  dates
}`

/** One request per arrangement; an editor's draft wins over the original. */
export function latestRequests(
  requests: CheckableRequest[],
): CheckableRequest[] {
  const byId = new Map<string, CheckableRequest>()
  for (const request of requests) {
    const id = request._id.replace(/^drafts\./, "")
    const current = byId.get(id)
    if (!current || request._id.startsWith("drafts.")) byId.set(id, request)
  }
  return [...byId.values()]
}

export type CrescatScanDependencies = {
  calendar: typeof fetchVenueCalendar
  resources: typeof fetchVenueResources
  now: () => Date
}

const defaults: CrescatScanDependencies = {
  calendar: fetchVenueCalendar,
  resources: fetchVenueResources,
  now: () => new Date(),
}

async function loadBookings(
  from: string,
  to: string,
  deps: CrescatScanDependencies,
): Promise<{ bookings: CresatBooking[]; roomNames: Map<number, string> }> {
  // The privat calendar spans every room and carries titles; the standard
  // calendar is merged in case a booking only appears there.
  const slugs = [ROOM_CALENDAR_SLUGS.privat, ROOM_CALENDAR_SLUGS.standard]
  const [calendars, resources] = await Promise.all([
    Promise.all(slugs.map(slug => deps.calendar(slug, from, to))),
    Promise.all(slugs.map(slug => deps.resources(slug))),
  ])
  const byId = new Map<number, CresatBooking>()
  for (const booking of calendars.flat()) {
    const existing = byId.get(booking.id)
    if (!existing || (!existing.title && booking.title))
      byId.set(booking.id, booking)
  }
  const roomNames = new Map<number, string>()
  for (const resource of resources.flat())
    if (!roomNames.has(resource.id))
      roomNames.set(resource.id, resource.title || resource.room_title || "")
  return { bookings: [...byId.values()], roomNames }
}

export type CrescatScanReport = {
  checked: number
  found: number
  maybe: number
  missing: number
  skipped: number
  /** Requests left alone because they were already checked once. */
  alreadyChecked: number
  failed: number
}

/**
 * Check new pending requests against Crescat and store one `crescatCheck` per
 * request. Each request is checked once: requests that already have a check
 * are skipped. `ids` checks exactly those requests (e.g. a just-submitted
 * one), whether or not they were checked before.
 */
export async function scanPendingRequests(
  client: SanityClient,
  options: { dryRun?: boolean; ids?: string[] } = {},
  deps: CrescatScanDependencies = defaults,
): Promise<CrescatScanReport & { results?: CrescatCheckDocument[] }> {
  const ids = options.ids?.flatMap(id => {
    const base = id.replace(/^drafts\./, "")
    return [base, `drafts.${base}`]
  })
  const pending = latestRequests(
    await client.fetch<CheckableRequest[]>(PENDING_REQUESTS, {
      ids: ids ?? null,
    }),
  )
  const checkedBefore = ids
    ? new Set<string>()
    : new Set(
        await client.fetch<string[]>(
          `*[_type == "crescatCheck"].arrangementId`,
        ),
      )
  const requests = pending.filter(
    request => !checkedBefore.has(request._id.replace(/^drafts\./, "")),
  )
  const report: CrescatScanReport = {
    checked: 0,
    found: 0,
    maybe: 0,
    missing: 0,
    skipped: 0,
    alreadyChecked: pending.length - requests.length,
    failed: 0,
  }
  const allDates = requests.flatMap(request =>
    checkableDates(request).map(date => date.startDate),
  )
  if (!allDates.length) return { ...report, skipped: requests.length }
  allDates.sort()
  const { bookings, roomNames } = await loadBookings(
    allDates[0],
    addDaysDateOnly(allDates[allDates.length - 1], 2),
    deps,
  )
  if (!bookings.length) {
    // An empty calendar means Crescat was unreachable; never paint every
    // request red because of it.
    throw new Error("Crescat calendar returned no bookings")
  }

  const checkedAt = deps.now().toISOString()
  const results: CrescatCheckDocument[] = []
  for (const request of requests) {
    const check = buildCrescatCheck(request, bookings, roomNames, checkedAt)
    if (!check) {
      report.skipped++
      continue
    }
    try {
      if (!options.dryRun) await client.createOrReplace(check)
      report.checked++
      report[check.status]++
      results.push(check)
    } catch {
      report.failed++
    }
  }
  return options.dryRun ? { ...report, results } : report
}
