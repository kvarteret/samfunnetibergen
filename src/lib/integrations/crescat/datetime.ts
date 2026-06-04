// Crescat expects "YYYY-MM-DD HH:mm:ss" local timestamps.

export function toDateTime(date: string, time: string): string {
    // "2026-05-22" + "21:00" → "2026-05-22 21:00:00"
    return `${date} ${time}:00`
}

function nextDay(date: string): string {
    const d = new Date(`${date}T00:00:00`)
    d.setDate(d.getDate() + 1)
    return d.toISOString().split("T")[0]
}

// Add a whole number of hours to a start time, advancing the date when the
// slot crosses midnight (e.g. a 2h slot starting 23:30 ends 01:30 next day).
export function addHoursToDateTime(date: string, time: string, hours: number): string {
    const [h, m] = time.split(":").map(Number)
    const totalMinutes = h * 60 + m + hours * 60
    const endH = Math.floor(totalMinutes / 60) % 24
    const endM = totalMinutes % 60
    const crossesMidnight = endH < h || (endH === h && endM < m)
    const endDate = crossesMidnight ? nextDay(date) : date
    return `${endDate} ${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}:00`
}

// Resolve the end timestamp from an explicit end time, advancing the date when
// the end is at or before the start (slot crosses midnight).
export function resolveEndDateTime(date: string, startTime: string, endTime: string): string {
    const [sh, sm] = startTime.split(":").map(Number)
    const [eh, em] = endTime.split(":").map(Number)
    const crossesMidnight = eh * 60 + em <= sh * 60 + sm
    const endDate = crossesMidnight ? nextDay(date) : date
    return `${endDate} ${endTime}:00`
}
