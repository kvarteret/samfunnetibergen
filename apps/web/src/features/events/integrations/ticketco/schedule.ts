import { TZDate } from "@date-fns/tz"
import { format } from "date-fns"

/** Wednesday 06:00 or Saturday 18:00 Oslo; delayed runners may retry that day. */
export function ticketCoSlot(now = new Date()): string | null {
  const date = new TZDate(now, "Europe/Oslo")
  const due =
    (date.getDay() === 3 && date.getHours() >= 6) ||
    (date.getDay() === 6 && date.getHours() >= 18)
  return due ? format(date, "yyyy-MM-dd") : null
}
