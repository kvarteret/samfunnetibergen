import {
  addMinutes,
  format,
  getISODay,
  parse,
  parseISO,
  startOfDay,
  subDays,
} from "date-fns"

export interface OpeningHoursRow {
  _key?: string | null
  weekdays?: Array<number | null> | null
  status?: "open" | "closed" | string | null
  duration?: {
    start?: string | null
    end?: string | null
  } | null
}

export interface OpeningHours {
  rows?: Array<OpeningHoursRow | null> | null
}

export interface ClosedDate {
  date?: string | null
}

export interface VacationMode {
  enabled?: boolean | null
  from?: string | null
  to?: string | null
}

export interface SlotRange {
  startMin: number
  endMin: number
}

export interface OpeningHoursStatus {
  isOpen: boolean
  currentRange?: SlotRange
  nextRange?: SlotRange
  nextDate?: string
}

export interface OpeningHoursDaySummary {
  date: string
  dayLabel: string
  ranges: SlotRange[]
}

const vacationReopenDateFormatter = new Intl.DateTimeFormat("nb-NO", {
  day: "numeric",
  month: "long",
  year: "numeric",
})
const openingDateFormatter = new Intl.DateTimeFormat("nb-NO", {
  day: "numeric",
  month: "long",
})

const MINUTES_IN_DAY = 24 * 60
const WEEKDAY_SHORT_LABELS: Record<number, string> = {
  1: "Man",
  2: "Tir",
  3: "Ons",
  4: "Tor",
  5: "Fre",
  6: "Lør",
  7: "Søn",
}
const WEEKDAY_LONG_LABELS: Record<number, string> = {
  1: "mandag",
  2: "tirsdag",
  3: "onsdag",
  4: "torsdag",
  5: "fredag",
  6: "lørdag",
  7: "søndag",
}

export function isoDate(date: Date): string {
  return format(date, "yyyy-MM-dd")
}

/**
 * Generate `count` consecutive ISO date strings starting from `today`.
 * Used by the booking form (7-day window) and karaoke form (60-day window).
 */
export function buildDateSequence(today: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today)
    date.setDate(date.getDate() + index)
    return isoDate(date)
  })
}

export function isoWeekday(dateStr: string): number {
  return getISODay(parseISO(dateStr))
}

export function isHouseClosed(
  dateStr: string,
  closedDates?: ClosedDate[] | null,
  vacationMode?: VacationMode | null,
): boolean {
  return (
    isVacationModeActive(dateStr, vacationMode) ||
    (closedDates ?? []).some(closedDate => closedDate?.date === dateStr)
  )
}

export function isVacationModeActive(
  dateStr: string,
  vacationMode?: VacationMode | null,
): boolean {
  if (vacationMode?.enabled !== true) return false
  if (vacationMode.from && dateStr < vacationMode.from) return false
  if (!vacationMode.to) return true
  return dateStr < vacationMode.to
}

export function formatVacationModeNotice(
  dateStr: string,
  vacationMode?: VacationMode | null,
): string | null {
  if (!isVacationModeActive(dateStr, vacationMode)) return null
  if (!vacationMode?.to) return "STENGT."
  return `Vi åpner igjen ${vacationReopenDateFormatter.format(
    new Date(`${vacationMode.to}T00:00:00`),
  )}`
}

export function formatOpeningDate(dateStr: string): string {
  return openingDateFormatter.format(new Date(`${dateStr}T00:00:00`))
}

export function timeToMinutes(time?: string | null): number | null {
  if (!time) return null
  const parsed = parse(time, "HH:mm", startOfDay(new Date()))
  if (Number.isNaN(parsed.getTime())) return null
  const midnight = startOfDay(parsed)
  return Math.round((parsed.getTime() - midnight.getTime()) / 60_000)
}

export function minutesToTime(minutes: number): string {
  const normalized =
    ((minutes % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY
  return format(addMinutes(startOfDay(new Date()), normalized), "HH:mm")
}

export function formatOpeningHoursTime(minutes: number): string {
  return minutesToTime(minutes).replace(":00", "")
}

export function formatWeekdays(
  weekdays?: Array<number | null> | null,
): string | null {
  const days = [
    ...new Set((weekdays ?? []).filter((day): day is number => day !== null)),
  ].sort((a, b) => a - b)
  if (!days.length) return null

  const isContiguous = days.every(
    (day, index) => index === 0 || day === days[index - 1] + 1,
  )
  if (isContiguous && days.length > 1) {
    return `${WEEKDAY_SHORT_LABELS[days[0]]}-${WEEKDAY_SHORT_LABELS[days[days.length - 1]]}`
  }

  return days.map(day => WEEKDAY_SHORT_LABELS[day]).join(", ")
}

export function formatOpeningHoursRow(row: OpeningHoursRow): string | null {
  const dayLabel = formatWeekdays(row.weekdays)
  if (!dayLabel) return null
  if (row.status === "closed") return `${dayLabel}: Stengt`
  if (!row.duration?.start || !row.duration.end) return dayLabel
  return `${dayLabel}: ${row.duration.start}-${row.duration.end}`
}

/**
 * Normalize a set of opening ranges into the canonical form every consumer
 * relies on: sorted by start, with overlapping or touching ranges merged into
 * one. Several opening-hours rows can match the same weekday (and intersecting
 * base/room hours can produce fragments), so without this the same minute can
 * appear in two ranges — which surfaced as duplicate, out-of-order time slots.
 */
function mergeRanges(ranges: SlotRange[]): SlotRange[] {
  const sorted = [...ranges].sort(
    (a, b) => a.startMin - b.startMin || a.endMin - b.endMin,
  )
  const merged: SlotRange[] = []
  for (const range of sorted) {
    const last = merged.at(-1)
    if (last && range.startMin <= last.endMin) {
      merged[merged.length - 1] = {
        startMin: last.startMin,
        endMin: Math.max(last.endMin, range.endMin),
      }
    } else {
      merged.push({ startMin: range.startMin, endMin: range.endMin })
    }
  }
  return merged
}

export function openingRangesForDate(
  dateStr: string,
  hours?: OpeningHours | null,
  closedDates?: ClosedDate[] | null,
  vacationMode?: VacationMode | null,
): SlotRange[] {
  if (isHouseClosed(dateStr, closedDates, vacationMode)) return []

  const weekday = isoWeekday(dateStr)
  const rows = (hours?.rows ?? []).flatMap(row => {
    if (!row || row.status === "closed") return []
    if (!row.weekdays?.includes(weekday)) return []

    const startMin = timeToMinutes(row.duration?.start)
    const endMin = timeToMinutes(row.duration?.end)
    if (startMin === null || endMin === null) return []

    return [
      {
        startMin,
        endMin: endMin <= startMin ? endMin + MINUTES_IN_DAY : endMin,
      },
    ]
  })

  return mergeRanges(rows)
}

export function openingHoursStatusAt(
  date: Date,
  hours?: OpeningHours | null,
  closedDates?: ClosedDate[] | null,
  vacationMode?: VacationMode | null,
): OpeningHoursStatus {
  const today = isoDate(date)
  const minutes = date.getHours() * 60 + date.getMinutes()

  const todayRange = openingRangesForDate(
    today,
    hours,
    closedDates,
    vacationMode,
  ).find(range => minutes >= range.startMin && minutes < range.endMin)
  if (todayRange) {
    return { isOpen: true, currentRange: todayRange }
  }

  const yesterday = isoDate(subDays(date, 1))
  const yesterdayRange = openingRangesForDate(
    yesterday,
    hours,
    closedDates,
    vacationMode,
  ).find(
    range =>
      range.endMin > MINUTES_IN_DAY && minutes + MINUTES_IN_DAY < range.endMin,
  )
  if (yesterdayRange) {
    return {
      isOpen: true,
      currentRange: {
        startMin: yesterdayRange.startMin - MINUTES_IN_DAY,
        endMin: yesterdayRange.endMin - MINUTES_IN_DAY,
      },
    }
  }

  for (let offset = 0; offset < 14; offset++) {
    const candidateDate = new Date(date)
    candidateDate.setDate(candidateDate.getDate() + offset)
    const dateStr = isoDate(candidateDate)
    const nextRange = openingRangesForDate(
      dateStr,
      hours,
      closedDates,
      vacationMode,
    ).find(range => offset > 0 || range.startMin > minutes)

    if (nextRange) return { isOpen: false, nextDate: dateStr, nextRange }
  }

  if (
    vacationMode?.enabled === true &&
    vacationMode.to &&
    isoDate(date) < vacationMode.to
  ) {
    const reopenDate = parseISO(vacationMode.to)
    for (let offset = 0; offset < 14; offset++) {
      const candidateDate = new Date(reopenDate)
      candidateDate.setDate(candidateDate.getDate() + offset)
      const dateStr = isoDate(candidateDate)
      const nextRange = openingRangesForDate(
        dateStr,
        hours,
        closedDates,
        null,
      )[0]

      if (nextRange) return { isOpen: false, nextDate: dateStr, nextRange }
    }
  }

  return { isOpen: false }
}

export function openingHoursDaySummaries(
  startDate: Date,
  count: number,
  hours?: OpeningHours | null,
  closedDates?: ClosedDate[] | null,
  vacationMode?: VacationMode | null,
): OpeningHoursDaySummary[] {
  return buildDateSequence(isoDate(startDate), count).map(date => ({
    date,
    dayLabel: WEEKDAY_LONG_LABELS[isoWeekday(date)],
    ranges: openingRangesForDate(date, hours, closedDates, vacationMode),
  }))
}

export function hasOpeningHoursRows(hours?: OpeningHours | null): boolean {
  return (hours?.rows ?? []).some(row => row != null)
}

export function combineOpeningRangesForDate(
  dateStr: string,
  baseHours?: OpeningHours | null,
  roomHours?: OpeningHours | null,
  closedDates?: ClosedDate[] | null,
  vacationMode?: VacationMode | null,
): SlotRange[] {
  const hasBaseHours = hasOpeningHoursRows(baseHours)
  const hasRoomHours = hasOpeningHoursRows(roomHours)

  if (!hasBaseHours && !hasRoomHours) return []
  if (!hasBaseHours)
    return openingRangesForDate(dateStr, roomHours, closedDates, vacationMode)
  if (!hasRoomHours)
    return openingRangesForDate(dateStr, baseHours, closedDates, vacationMode)

  const baseRanges = openingRangesForDate(
    dateStr,
    baseHours,
    closedDates,
    vacationMode,
  )
  const roomRanges = openingRangesForDate(
    dateStr,
    roomHours,
    closedDates,
    vacationMode,
  )

  const intersections = baseRanges.flatMap(baseRange =>
    roomRanges.flatMap(roomRange => {
      const startMin = Math.max(baseRange.startMin, roomRange.startMin)
      const endMin = Math.min(baseRange.endMin, roomRange.endMin)
      return startMin < endMin ? [{ startMin, endMin }] : []
    }),
  )

  return mergeRanges(intersections)
}

export function isOpenAt(
  date: Date,
  hours?: OpeningHours | null,
  closedDates?: ClosedDate[] | null,
  vacationMode?: VacationMode | null,
): boolean {
  const today = isoDate(date)
  if (isHouseClosed(today, closedDates, vacationMode)) return false

  const minutes = date.getHours() * 60 + date.getMinutes()
  const todayRanges = openingRangesForDate(
    today,
    hours,
    closedDates,
    vacationMode,
  ).some(range => minutes >= range.startMin && minutes < range.endMin)
  if (todayRanges) return true

  const yesterday = isoDate(subDays(date, 1))
  return openingRangesForDate(yesterday, hours, closedDates, vacationMode).some(
    range =>
      range.endMin > MINUTES_IN_DAY && minutes + MINUTES_IN_DAY < range.endMin,
  )
}

export function isOpenAtForCombinedHours(
  date: Date,
  baseHours?: OpeningHours | null,
  roomHours?: OpeningHours | null,
  closedDates?: ClosedDate[] | null,
  vacationMode?: VacationMode | null,
): boolean {
  const today = isoDate(date)
  if (isHouseClosed(today, closedDates, vacationMode)) return false

  const minutes = date.getHours() * 60 + date.getMinutes()
  const todayRanges = combineOpeningRangesForDate(
    today,
    baseHours,
    roomHours,
    closedDates,
    vacationMode,
  ).some(range => minutes >= range.startMin && minutes < range.endMin)
  if (todayRanges) return true

  const yesterday = isoDate(subDays(date, 1))
  return combineOpeningRangesForDate(
    yesterday,
    baseHours,
    roomHours,
    closedDates,
    vacationMode,
  ).some(
    range =>
      range.endMin > MINUTES_IN_DAY && minutes + MINUTES_IN_DAY < range.endMin,
  )
}

/**
 * Slot start minutes that fit `durationHours` within the given opening ranges.
 * Ranges are expected to be normalized (sorted, disjoint) by their producers
 * (`openingRangesForDate` / `combineOpeningRangesForDate`), so the result is
 * naturally ascending and duplicate-free without any extra bookkeeping here.
 */
function slotStartsFromRanges(
  ranges: SlotRange[],
  durationHours: number,
  stepMin: number,
): number[] {
  const durationMin = durationHours * 60
  return ranges.flatMap(range => {
    const count =
      Math.floor((range.endMin - range.startMin - durationMin) / stepMin) + 1
    if (count <= 0) return []
    return Array.from(
      { length: count },
      (_, index) => range.startMin + index * stepMin,
    )
  })
}

export function slotRangesForDate(
  dateStr: string,
  durationHours: number,
  hours?: OpeningHours | null,
  closedDates?: ClosedDate[] | null,
  vacationMode?: VacationMode | null,
  stepMin = 60,
): number[] {
  return slotStartsFromRanges(
    openingRangesForDate(dateStr, hours, closedDates, vacationMode),
    durationHours,
    stepMin,
  )
}

export function combinedSlotRangesForDate(
  dateStr: string,
  durationHours: number,
  baseHours?: OpeningHours | null,
  roomHours?: OpeningHours | null,
  closedDates?: ClosedDate[] | null,
  vacationMode?: VacationMode | null,
  stepMin = 60,
): number[] {
  return slotStartsFromRanges(
    combineOpeningRangesForDate(
      dateStr,
      baseHours,
      roomHours,
      closedDates,
      vacationMode,
    ),
    durationHours,
    stepMin,
  )
}

export function isSlotAllowed(
  actualDateStr: string,
  startTime: string,
  durationHours: number,
  hours?: OpeningHours | null,
  closedDates?: ClosedDate[] | null,
  vacationMode?: VacationMode | null,
): boolean {
  if (isHouseClosed(actualDateStr, closedDates, vacationMode)) return false

  const startMin = timeToMinutes(startTime)
  if (startMin === null) return false

  const durationMin = durationHours * 60
  const actualDate = parseISO(actualDateStr)

  const candidates = [
    { date: actualDateStr, startMin },
    {
      date: isoDate(subDays(actualDate, 1)),
      startMin: startMin + MINUTES_IN_DAY,
    },
  ]

  return candidates.some(candidate =>
    openingRangesForDate(candidate.date, hours, closedDates, vacationMode).some(
      range =>
        candidate.startMin >= range.startMin &&
        candidate.startMin + durationMin <= range.endMin,
    ),
  )
}

export function isSlotAllowedForCombinedHours(
  actualDateStr: string,
  startTime: string,
  durationHours: number,
  baseHours?: OpeningHours | null,
  roomHours?: OpeningHours | null,
  closedDates?: ClosedDate[] | null,
  vacationMode?: VacationMode | null,
): boolean {
  if (isHouseClosed(actualDateStr, closedDates, vacationMode)) return false

  const startMin = timeToMinutes(startTime)
  if (startMin === null) return false

  const durationMin = durationHours * 60
  const actualDate = parseISO(actualDateStr)

  const candidates = [
    { date: actualDateStr, startMin },
    {
      date: isoDate(subDays(actualDate, 1)),
      startMin: startMin + MINUTES_IN_DAY,
    },
  ]

  return candidates.some(candidate =>
    combineOpeningRangesForDate(
      candidate.date,
      baseHours,
      roomHours,
      closedDates,
      vacationMode,
    ).some(
      range =>
        candidate.startMin >= range.startMin &&
        candidate.startMin + durationMin <= range.endMin,
    ),
  )
}
