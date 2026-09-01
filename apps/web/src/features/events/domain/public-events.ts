import { TZDate } from "@date-fns/tz"
import {
  type EventStatus,
  resolveEffectiveStatus,
  resolveEventContent,
} from "@samfunnet/content-domain/resolve-event"

import {
  cleanEventDate,
  cleanEventLogicFields,
} from "@/lib/sanity/fetch/event-normalization"

export const PUBLIC_EVENT_KINDS = [
  "single",
  "seriesParent",
  "seriesInstance",
  "festivalParent",
  "festivalSession",
] as const

export type PublicEventKind = (typeof PUBLIC_EVENT_KINDS)[number]
export type PublicTimeZone = "Europe/Oslo"

export type PublicEventDate = {
  _key: string
  startDate: string
  startTime: string | null
  endTime: string | null
}

export type PublicParentSummary = {
  _id: string
  _updatedAt: string | null
  eventKind: PublicEventKind
  eventStatus: EventStatus
  slug: string
  title: string
}

export type PublicOrganizerGroup = {
  _id: string
  name: string
  slug: string
}

export type PublicEventType = {
  _id: string
  name: string
  taxonomyGroup: {
    _id: string
    name: string
  } | null
}

export type PublicRoom = {
  _id: string
  title: string
  slug: string
  floor: number | null
  imageUrl: string | null
}

type PublicPortableTextBlock = {
  _key?: string
  _type: string
  [key: string]: unknown
}

export type PublicEvent = {
  _id: string
  _updatedAt: string | null
  effectiveUpdatedAt: string | null
  eventKind: PublicEventKind
  eventStatus: EventStatus
  isPromoted: boolean
  promotedPlacement: "top" | "pool" | null
  promotedOrder: number | null
  orderRank: string | null
  isRecurring: boolean
  rrule: string | null
  slug: string
  title: string
  description: PublicPortableTextBlock[]
  imageUrl: string | null
  imageCaption: string | null
  organizerGroup: PublicOrganizerGroup | null
  organizerText: string | null
  eventType: PublicEventType | null
  isFree: boolean
  priceOrdinar: number | null
  priceStudent: number | null
  priceMedlem: number | null
  ticketUrl: string | null
  facebookUrl: string | null
  room: PublicRoom | null
  roomText: string | null
  parentEvent: PublicParentSummary | null
  dates: PublicEventDate[]
}

export type PublicSchedule = {
  startDate: string
  startTime: string | null
  endDate: string | null
  endTime: string | null
  startsAt: string | null
  endsAt: string | null
  timeZone: PublicTimeZone
}

export type PublicOccurrence = {
  id: string
  event: PublicEvent
  dateKey: string
  schedule: PublicSchedule
}

export type RawPublicEventDate = {
  _key?: string | null
  startDate?: string | null
  startTime?: string | null
  endTime?: string | null
}

export type RawPublicParent = {
  _id: string
  _updatedAt?: string | null
  eventKind?: string | null
  eventStatus?: EventStatus | null
  title?: string | null
  description?: readonly unknown[] | null
  imageUrl?: string | null
  imageCaption?: string | null
  organizerGroup?: PublicOrganizerGroup | null
  organizerText?: string | null
  eventType?: PublicEventType | null
  isFree?: boolean | null
  priceOrdinar?: number | null
  priceStudent?: number | null
  priceMedlem?: number | null
  ticketUrl?: string | null
  facebookUrl?: string | null
  room?: PublicRoom | null
  roomText?: string | null
  slug?: string | null
  isInternalEvent?: boolean | null
}

export type RawPublicEvent = {
  _id: string
  _updatedAt?: string | null
  eventKind?: string | null
  eventStatus?: EventStatus | null
  isPromoted?: boolean | null
  promotedPlacement?: "top" | "pool" | null
  promotedOrder?: number | null
  orderRank?: string | null
  isRecurring?: boolean | null
  rrule?: string | null
  parent?: RawPublicParent | null
  slug?: string | null
  title?: string | null
  description?: readonly unknown[] | null
  imageUrl?: string | null
  imageCaption?: string | null
  organizerGroup?: PublicOrganizerGroup | null
  organizerText?: string | null
  eventType?: PublicEventType | null
  isFree?: boolean | null
  priceOrdinar?: number | null
  priceStudent?: number | null
  priceMedlem?: number | null
  ticketUrl?: string | null
  facebookUrl?: string | null
  room?: PublicRoom | null
  roomText?: string | null
  isInternalEvent?: boolean | null
  useFestivalImage?: boolean | null
  dates?: readonly (RawPublicEventDate | null)[] | null
}

const MISSING_TITLE = "[Mangler arrangementstittel]"
const OSLO_TIME_ZONE: PublicTimeZone = "Europe/Oslo"
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/
const TIME_PATTERN = /^(\d{2}):(\d{2})(?::(\d{2}))?$/

function normalizeEventKind(value: string | null | undefined): PublicEventKind {
  return PUBLIC_EVENT_KINDS.includes(value as PublicEventKind)
    ? (value as PublicEventKind)
    : "single"
}

function normalizeString(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null
  const normalized = value.trim()
  return normalized || null
}

function latestTimestamp(
  childTimestamp: string | null | undefined,
  parentTimestamp: string | null | undefined,
): string | null {
  const candidates = [childTimestamp, parentTimestamp].filter(
    (value): value is string =>
      typeof value === "string" && Number.isFinite(Date.parse(value)),
  )
  if (candidates.length === 0) return null

  return candidates.reduce((latest, candidate) =>
    Date.parse(candidate) > Date.parse(latest) ? candidate : latest,
  )
}

function validDateParts(value: string): [number, number, number] | null {
  const match = DATE_PATTERN.exec(value)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }

  return [year, month, day]
}

function validTimeParts(value: string): [number, number, number] | null {
  const match = TIME_PATTERN.exec(value)
  if (!match) return null

  const hours = Number(match[1])
  const minutes = Number(match[2])
  const seconds = Number(match[3] ?? 0)
  if (hours > 23 || minutes > 59 || seconds > 59) return null

  return [hours, minutes, seconds]
}

function nextCalendarDate(value: string): string {
  const parts = validDateParts(value)
  if (!parts) return value

  const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + 1))
  return [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()]
    .map(part => String(part).padStart(2, "0"))
    .join("-")
}

function timeInSeconds(value: string): number | null {
  const parts = validTimeParts(value)
  return parts ? parts[0] * 3600 + parts[1] * 60 + parts[2] : null
}

function toOsloTimestamp(date: string, time: string): string | null {
  const dateParts = validDateParts(date)
  const timeParts = validTimeParts(time)
  if (!dateParts || !timeParts) return null

  const zonedDate = new TZDate(
    dateParts[0],
    dateParts[1] - 1,
    dateParts[2],
    timeParts[0],
    timeParts[1],
    timeParts[2],
    OSLO_TIME_ZONE,
  )
  return new Date(zonedDate.getTime()).toISOString()
}

export function normalizePublicSchedule(date: PublicEventDate): PublicSchedule {
  const startTime = normalizeString(date.startTime)
  const endTime = normalizeString(date.endTime)
  const startSeconds = startTime ? timeInSeconds(startTime) : null
  const endSeconds = endTime ? timeInSeconds(endTime) : null
  const endDate = endTime
    ? startSeconds != null && endSeconds != null && endSeconds < startSeconds
      ? nextCalendarDate(date.startDate)
      : date.startDate
    : null

  return {
    startDate: date.startDate,
    startTime,
    endDate,
    endTime,
    startsAt: startTime ? toOsloTimestamp(date.startDate, startTime) : null,
    endsAt:
      endDate && endTime && startTime
        ? toOsloTimestamp(endDate, endTime)
        : null,
    timeZone: OSLO_TIME_ZONE,
  }
}

function normalizeDate(
  date: RawPublicEventDate,
  index: number,
): PublicEventDate | null {
  if (typeof date.startDate !== "string" || !validDateParts(date.startDate)) {
    return null
  }

  const cleaned = cleanEventDate({
    _key: date._key ?? `${date.startDate}-${index}`,
    startDate: date.startDate,
    startTime: date.startTime ?? null,
    endTime: date.endTime ?? null,
  })

  return {
    _key: cleaned._key ?? `${cleaned.startDate}-${index}`,
    startDate: cleaned.startDate,
    startTime: cleaned.startTime,
    endTime: cleaned.endTime,
  }
}

/** Resolve one Sanity projection row into the public event domain model. */
export function resolvePublicEvent(row: RawPublicEvent): PublicEvent {
  const { parent, ...child } = row
  const cleanChild = cleanEventLogicFields(child)
  const cleanParent = parent ? cleanEventLogicFields(parent) : null
  const inheritFestivalImage =
    cleanChild.eventKind !== "festivalSession" ||
    cleanChild.useFestivalImage !== false
  const effectiveParent =
    cleanParent && !inheritFestivalImage
      ? { ...cleanParent, imageUrl: null, imageCaption: null }
      : cleanParent
  const content = resolveEventContent(cleanChild, effectiveParent)
  const dates = (Array.isArray(content.dates) ? content.dates : []).flatMap(
    (date, index) => {
      if (!date) return []
      const normalized = normalizeDate(date, index)
      return normalized ? [normalized] : []
    },
  )

  return {
    _id: content._id,
    _updatedAt: content._updatedAt ?? null,
    effectiveUpdatedAt: latestTimestamp(
      content._updatedAt,
      cleanParent?._updatedAt,
    ),
    eventKind: normalizeEventKind(content.eventKind),
    eventStatus: resolveEffectiveStatus(
      content.eventStatus ?? null,
      cleanParent?.eventStatus ?? null,
    ),
    isPromoted: content.isPromoted ?? false,
    promotedPlacement: content.promotedPlacement ?? null,
    promotedOrder: content.promotedOrder ?? null,
    orderRank: content.orderRank ?? null,
    isRecurring: content.isRecurring ?? false,
    rrule: normalizeString(content.rrule),
    slug: normalizeString(content.slug) ?? "",
    title: normalizeString(content.title) ?? MISSING_TITLE,
    description: Array.isArray(content.description)
      ? (content.description as PublicPortableTextBlock[])
      : [],
    imageUrl: normalizeString(content.imageUrl),
    imageCaption: normalizeString(content.imageCaption),
    organizerGroup: content.organizerGroup ?? null,
    organizerText: normalizeString(content.organizerText),
    eventType: content.eventType ?? null,
    isFree: content.isFree ?? false,
    priceOrdinar: content.priceOrdinar ?? null,
    priceStudent: content.priceStudent ?? null,
    priceMedlem: content.priceMedlem ?? null,
    ticketUrl: normalizeString(content.ticketUrl),
    facebookUrl: normalizeString(content.facebookUrl),
    room: content.room ?? null,
    roomText: normalizeString(content.roomText),
    parentEvent: cleanParent
      ? {
          _id: cleanParent._id,
          _updatedAt: cleanParent._updatedAt ?? null,
          eventKind: normalizeEventKind(cleanParent.eventKind),
          eventStatus: cleanParent.eventStatus ?? "scheduled",
          slug: cleanParent.slug ?? "",
          title: normalizeString(cleanParent.title) ?? MISSING_TITLE,
        }
      : null,
    dates,
  }
}

function occurrenceId(eventId: string, dateKey: string): string {
  return `occurrence:${eventId}:${dateKey}`
}

export type PublicOccurrenceOrderingKey = {
  startDate: string
  startTime: string | null
  eventId: string
  dateKey: string
}

function publicOccurrenceOrderingKey(
  occurrence: PublicOccurrence,
): PublicOccurrenceOrderingKey {
  return {
    startDate: occurrence.schedule.startDate,
    startTime: occurrence.schedule.startTime,
    eventId: occurrence.event._id,
    dateKey: occurrence.dateKey,
  }
}

function compareOrderingKeys(
  left: PublicOccurrenceOrderingKey,
  right: PublicOccurrenceOrderingKey,
): number {
  const leftKey = [
    left.startDate,
    left.startTime ?? "99:99",
    left.eventId,
    left.dateKey,
  ]
  const rightKey = [
    right.startDate,
    right.startTime ?? "99:99",
    right.eventId,
    right.dateKey,
  ]

  for (let index = 0; index < leftKey.length; index += 1) {
    if (leftKey[index] < rightKey[index]) return -1
    if (leftKey[index] > rightKey[index]) return 1
  }
  return 0
}

export function comparePublicOccurrences(
  left: PublicOccurrence,
  right: PublicOccurrence,
): number {
  return compareOrderingKeys(
    publicOccurrenceOrderingKey(left),
    publicOccurrenceOrderingKey(right),
  )
}

export function comparePublicOccurrenceToKey(
  occurrence: PublicOccurrence,
  key: PublicOccurrenceOrderingKey,
): number {
  return compareOrderingKeys(publicOccurrenceOrderingKey(occurrence), key)
}

export function isValidPublicDate(value: string): boolean {
  return validDateParts(value) !== null
}

/** Flatten events into globally ordered, one-date calendar occurrences. */
export function flattenPublicOccurrences(
  events: readonly PublicEvent[],
  range: { from: string | null; to: string | null } = {
    from: null,
    to: null,
  },
): PublicOccurrence[] {
  return events
    .flatMap(event =>
      event.dates.flatMap(date => {
        if (
          !isValidPublicDate(date.startDate) ||
          (range.from !== null && date.startDate < range.from) ||
          (range.to !== null && date.startDate > range.to)
        ) {
          return []
        }

        const schedule = normalizePublicSchedule(date)
        return [
          {
            id: occurrenceId(event._id, date._key),
            event,
            dateKey: date._key,
            schedule,
          },
        ]
      }),
    )
    .sort(comparePublicOccurrences)
}
