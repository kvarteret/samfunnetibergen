import { addMinutes, format, getISODay, parse, parseISO, startOfDay, subDays } from "date-fns"

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

export interface SlotRange {
    startMin: number
    endMin: number
}

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

export function isoDate(date: Date): string {
    return format(date, "yyyy-MM-dd")
}

export function isoWeekday(dateStr: string): number {
    return getISODay(parseISO(dateStr))
}

export function isHouseClosed(dateStr: string, closedDates?: ClosedDate[] | null): boolean {
    return (closedDates ?? []).some(closedDate => closedDate?.date === dateStr)
}

export function timeToMinutes(time?: string | null): number | null {
    if (!time) return null
    const parsed = parse(time, "HH:mm", startOfDay(new Date()))
    if (Number.isNaN(parsed.getTime())) return null
    const midnight = startOfDay(parsed)
    return Math.round((parsed.getTime() - midnight.getTime()) / 60_000)
}

export function minutesToTime(minutes: number): string {
    const normalized = ((minutes % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY
    return format(addMinutes(startOfDay(new Date()), normalized), "HH:mm")
}

export function formatWeekdays(weekdays?: Array<number | null> | null): string | null {
    const days = [...new Set((weekdays ?? []).filter((day): day is number => day !== null))].sort(
        (a, b) => a - b,
    )
    if (!days.length) return null

    const isContiguous = days.every((day, index) => index === 0 || day === days[index - 1] + 1)
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

export function openingRangesForDate(
    dateStr: string,
    hours?: OpeningHours | null,
    closedDates?: ClosedDate[] | null,
): SlotRange[] {
    if (isHouseClosed(dateStr, closedDates)) return []

    const weekday = isoWeekday(dateStr)
    return (hours?.rows ?? []).flatMap(row => {
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
}

export function isOpenAt(
    date: Date,
    hours?: OpeningHours | null,
    closedDates?: ClosedDate[] | null,
): boolean {
    const today = isoDate(date)
    if (isHouseClosed(today, closedDates)) return false

    const minutes = date.getHours() * 60 + date.getMinutes()
    const todayRanges = openingRangesForDate(today, hours, closedDates).some(
        range => minutes >= range.startMin && minutes < range.endMin,
    )
    if (todayRanges) return true

    const yesterday = isoDate(subDays(date, 1))
    return openingRangesForDate(yesterday, hours, closedDates).some(
        range => range.endMin > MINUTES_IN_DAY && minutes + MINUTES_IN_DAY < range.endMin,
    )
}

export function slotRangesForDate(
    dateStr: string,
    durationHours: number,
    hours?: OpeningHours | null,
    closedDates?: ClosedDate[] | null,
): number[] {
    const durationMin = durationHours * 60
    return openingRangesForDate(dateStr, hours, closedDates).flatMap(range => {
        const count = Math.floor((range.endMin - range.startMin - durationMin) / 60) + 1
        if (count <= 0) return []
        return Array.from({ length: count }, (_, index) => range.startMin + index * 60)
    })
}

export function isSlotAllowed(
    actualDateStr: string,
    startTime: string,
    durationHours: number,
    hours?: OpeningHours | null,
    closedDates?: ClosedDate[] | null,
): boolean {
    if (isHouseClosed(actualDateStr, closedDates)) return false

    const startMin = timeToMinutes(startTime)
    if (startMin === null) return false

    const durationMin = durationHours * 60
    const actualDate = parseISO(actualDateStr)

    const candidates = [
        { date: actualDateStr, startMin },
        { date: isoDate(subDays(actualDate, 1)), startMin: startMin + MINUTES_IN_DAY },
    ]

    return candidates.some(candidate =>
        openingRangesForDate(candidate.date, hours, closedDates).some(
            range =>
                candidate.startMin >= range.startMin &&
                candidate.startMin + durationMin <= range.endMin,
        ),
    )
}
