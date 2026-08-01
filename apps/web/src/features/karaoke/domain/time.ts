import { addDays, parseISO } from "date-fns"

import { isoDate, minutesToTime } from "@/lib/opening-hours"

import { timeToMinutes } from "@/lib/time"
export { timeToMinutes }
export { minutesToTime as minutesToTimeOfDay }

/** Add hours to "HH:MM" string, returning "HH:MM" (wraps past 24h). */
export function addHours(time: string, hours: number): string {
  if (!time) return ""
  return minutesToTime(timeToMinutes(time) + hours * 60)
}

/**
 * Resolve the calendar date when a slot may cross midnight.
 * slotStartMin is minutes from midnight of `dateStr`; if ≥ 1440 the
 * slot starts on a later calendar day.
 */
export function resolveSlotDate(dateStr: string, slotStartMin: number): string {
  return isoDate(
    addDays(parseISO(dateStr), Math.floor(slotStartMin / (24 * 60))),
  )
}
