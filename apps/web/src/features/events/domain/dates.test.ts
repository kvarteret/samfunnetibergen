import { afterEach, describe, expect, test, vi } from "vitest"
import { formatHumanDate } from "./dates"

const labels = {
  today: "I dag",
  tomorrow: "I morgen",
  inNDays: (days: number) => `Om ${days} dager`,
}

function eventDate(startDate: string) {
  return { _key: startDate, startDate }
}

describe("formatHumanDate", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  test("uses human names through seven days ahead", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-09-14T12:00:00Z"))

    expect(formatHumanDate(eventDate("2026-09-14"), labels)).toBe("I dag")
    expect(formatHumanDate(eventDate("2026-09-15"), labels)).toBe("I morgen")
    expect(formatHumanDate(eventDate("2026-09-21"), labels)).toBe("Om 7 dager")
  })

  test("falls back outside the seven-day window", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-09-14T12:00:00Z"))

    expect(formatHumanDate(eventDate("2026-09-13"), labels)).toBeNull()
    expect(formatHumanDate(eventDate("2026-09-22"), labels)).toBeNull()
  })
})
