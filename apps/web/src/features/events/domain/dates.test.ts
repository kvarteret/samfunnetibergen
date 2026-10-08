import { afterEach, describe, expect, test, vi } from "vitest"
import {
  buildCardDateLabels,
  formatFestivalRun,
  formatHumanDate,
  formatWeekday,
  getRecurringLabel,
} from "./dates"

const labels = {
  today: "I dag",
  tomorrow: "I morgen",
  weekday: (date: Date) => formatWeekday(date, "nb"),
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
    expect(formatHumanDate(eventDate("2026-09-16"), labels)).toBe("Onsdag")
    expect(formatHumanDate(eventDate("2026-09-17"), labels)).toBe("Torsdag")
    expect(formatHumanDate(eventDate("2026-09-21"), labels)).toBe("Mandag")
  })

  test("uses the Oslo calendar day on a UTC server", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-09-13T22:30:00Z"))

    expect(formatHumanDate(eventDate("2026-09-14"), labels)).toBe("I dag")
  })

  test("localizes weekday names", () => {
    const date = new Date("2026-09-16T12:00:00Z")

    expect(formatWeekday(date, "nb")).toBe("Onsdag")
    expect(formatWeekday(date, "en")).toBe("Wednesday")
  })

  test("falls back outside the seven-day window", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-09-14T12:00:00Z"))

    expect(formatHumanDate(eventDate("2026-09-13"), labels)).toBeNull()
    expect(formatHumanDate(eventDate("2026-09-22"), labels)).toBeNull()
  })
})

test("accepts an explicit reference instant across Oslo midnight", () => {
  expect(
    formatHumanDate(
      eventDate("2026-09-14"),
      labels,
      new Date("2026-09-13T22:30:00Z"),
    ),
  ).toBe("I dag")
  expect(
    formatHumanDate(
      eventDate("2026-09-14"),
      labels,
      new Date("2026-09-13T21:30:00Z"),
    ),
  ).toBe("I morgen")
})

const recurring = {
  daily: "Daglig",
  weekly: "Ukentlig",
  monthly: "Månedlig",
  generic: "Gjentakende",
  weeklyOn: (weekday: string) => `Hver ${weekday}`,
}

describe("getRecurringLabel", () => {
  test("names the weekday of a weekly series", () => {
    expect(getRecurringLabel("FREQ=WEEKLY;BYDAY=WE", recurring, "onsdag")).toBe(
      "Hver onsdag",
    )
    expect(getRecurringLabel("FREQ=WEEKLY", recurring)).toBe("Ukentlig")
    expect(
      getRecurringLabel("FREQ=WEEKLY;INTERVAL=2", recurring, "onsdag"),
    ).toBe("Gjentakende")
  })
})

describe("festival cards", () => {
  const cardLabels = {
    ...labels,
    days: (count: number) => `${count} dager`,
    events: (count: number) => `${count} arrangementer`,
    weekdayName: (date: Date) => formatWeekday(date, "nb").toLowerCase(),
    recurring,
  }
  const now = new Date("2026-10-01T12:00:00Z")
  const dates = [
    {
      _key: "a",
      startDate: "2026-10-15",
      startTime: "12:30",
      endTime: "14:10",
    },
    { _key: "b", startDate: "2026-10-15", startTime: "15:00", endTime: null },
    { _key: "c", startDate: "2026-10-22", startTime: "21:00", endTime: null },
  ]

  test("spans the whole run from the first start time", () => {
    expect(formatFestivalRun(dates, cardLabels, now)).toBe(
      "15. oktober 2026, 12:30 · 8 dager",
    )
  })

  test("counts programme events instead of listing dates", () => {
    const result = buildCardDateLabels(
      { eventKind: "festivalParent", dates },
      "2026-10-01",
      cardLabels,
      now,
    )
    expect(result.programmeLabel).toBe("3 arrangementer")
    expect(result.recurringLabel).toBeNull()
  })

  test("reads a series instance's rhythm from its parent", () => {
    const result = buildCardDateLabels(
      {
        eventKind: "seriesInstance",
        dates: [{ _key: "x", startDate: "2026-10-07", startTime: "16:30" }],
        parentEvent: { rrule: "FREQ=WEEKLY;BYDAY=WE" },
      },
      "2026-10-01",
      cardLabels,
      now,
    )
    expect(result.recurringLabel).toBe("Hver onsdag")
  })
})

test("weekly cards put plural weekdays on the date line and retain detail recurrence", () => {
  const result = buildCardDateLabels(
    {
      eventKind: "seriesInstance",
      dates: [
        {
          _key: "monday",
          startDate: "2026-10-12",
          startTime: "16:30",
          endTime: "18:00",
        },
      ],
      parentEvent: { rrule: "FREQ=WEEKLY;BYDAY=MO" },
    },
    "2026-10-08",
    {
      ...labels,
      recurring,
      days: count => `${count} dager`,
      events: count => `${count} arrangementer`,
      weekdayName: date => formatWeekday(date, "nb").toLowerCase(),
      weeklyDate: weekday =>
        `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}er`,
    },
    new Date("2026-10-08T12:00:00Z"),
  )
  expect(result.primaryDateLabel).toBe("Mandager, 16:30–18:00")
  expect(result.recurringLabel).toBeNull()
  expect(result.recurringDetailLabel).toBe("Hver mandag")
})
