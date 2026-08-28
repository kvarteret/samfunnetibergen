import { stegaClean } from "@sanity/client/stega"

type EventLogicFields = {
  eventKind?: string | null
  eventStatus?: string | null
  approvalStatus?: string | null
  promotedPlacement?: string | null
  orderRank?: string | null
  rrule?: string | null
}

type EventDateFields = {
  startDate: string
  startTime: string | null
  endTime: string | null
}

const EVENT_LOGIC_KEYS = [
  "eventKind",
  "eventStatus",
  "approvalStatus",
  "promotedPlacement",
  "orderRank",
  "rrule",
] as const

/**
 * Clean only strings that drive event-domain logic. Other fields stay
 * stega-encoded so titles, descriptions, and other display content retain
 * their Visual Editing overlays.
 */
export function cleanEventLogicFields<T extends EventLogicFields>(event: T): T {
  const cleaned = { ...event } as Record<string, unknown>
  for (const key of EVENT_LOGIC_KEYS) {
    if (key in event) cleaned[key] = stegaClean(event[key])
  }
  return cleaned as T
}

/** Date/time values are parsed and sorted before rendering. */
export function cleanEventDate<T extends EventDateFields>(date: T): T {
  const logicFields = stegaClean({
    startDate: date.startDate,
    startTime: date.startTime,
    endTime: date.endTime,
  })
  return { ...date, ...logicFields }
}
