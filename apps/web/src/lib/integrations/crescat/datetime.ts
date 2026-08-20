// Crescat expects "YYYY-MM-DD HH:mm:ss" local timestamps.

const CRESCAT_LOCAL_DATE_TIME =
  /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})$/

/**
 * Convert a timezone-less Crescat timestamp to a comparable wall-clock value.
 *
 * Crescat's public calendars return local-looking values without an offset.
 * Our venue and users operate in Norway, so the integration treats those
 * components as Norwegian civil time. Date.UTC is deliberate: it gives the
 * components a stable numeric representation without letting the runtime's
 * timezone reinterpret them.
 */
export function crescatLocalDateTimeMs(value: string): number {
  const match = CRESCAT_LOCAL_DATE_TIME.exec(value)
  if (!match) {
    throw new Error(`Unexpected Crescat date-time format: ${value}`)
  }

  const [, year, month, day, hour, minute, second] = match
  const result = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  )
  const parsed = new Date(result)
  if (
    parsed.getUTCFullYear() !== Number(year) ||
    parsed.getUTCMonth() !== Number(month) - 1 ||
    parsed.getUTCDate() !== Number(day) ||
    parsed.getUTCHours() !== Number(hour) ||
    parsed.getUTCMinutes() !== Number(minute) ||
    parsed.getUTCSeconds() !== Number(second)
  ) {
    throw new Error(`Invalid Crescat date-time value: ${value}`)
  }

  return result
}

export function toDateTime(date: string, time: string): string {
  // "2026-05-22" + "21:00" → "2026-05-22 21:00:00"
  return `${date} ${time}:00`
}

export function addDaysDateOnly(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number)
  const d = new Date(Date.UTC(year, month - 1, day + days))
  return d.toISOString().split("T")[0]
}

// Add a whole number of hours to a start time, advancing the date when the
// slot crosses midnight (e.g. a 2h slot starting 23:30 ends 01:30 next day).
export function addHoursToDateTime(
  date: string,
  time: string,
  hours: number,
): string {
  const [h, m] = time.split(":").map(Number)
  const totalMinutes = h * 60 + m + hours * 60
  const endH = Math.floor(totalMinutes / 60) % 24
  const endM = totalMinutes % 60
  const crossesMidnight = endH < h || (endH === h && endM < m)
  const endDate = crossesMidnight ? addDaysDateOnly(date, 1) : date
  return `${endDate} ${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}:00`
}

// Resolve the end timestamp from an explicit end time, advancing the date when
// the end is at or before the start (slot crosses midnight).
export function resolveEndDateTime(
  date: string,
  startTime: string,
  endTime: string,
): string {
  const [sh, sm] = startTime.split(":").map(Number)
  const [eh, em] = endTime.split(":").map(Number)
  const crossesMidnight = eh * 60 + em <= sh * 60 + sm
  const endDate = crossesMidnight ? addDaysDateOnly(date, 1) : date
  return `${endDate} ${endTime}:00`
}
