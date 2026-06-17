import { addDays, parseISO } from "date-fns"

import { isoDate } from "@/lib/opening-hours"

import { timeToMinutes } from "@/lib/time"
export { timeToMinutes }

/** Convert minutes from midnight to "HH:MM" (wraps past 24h). */
export function minutesToTimeOfDay(minutes: number): string {
  return `${String(Math.floor(minutes / 60) % 24).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`
}

/** Add hours to "HH:MM" string, returning "HH:MM" (wraps past 24h). */
export function addHours(time: string, hours: number): string {
  if (!time) return ""
  return minutesToTimeOfDay(timeToMinutes(time) + hours * 60)
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
