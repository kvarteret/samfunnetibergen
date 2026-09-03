import { describe, expect, it } from "vitest"

import { buildCalendarMonths as groupCalendarMonths } from "./calendar"
import { flattenPublicOccurrences, resolvePublicEvent } from "./events"

function event(
  id: string,
  dates: Array<{
    _key: string
    startDate: string
    startTime?: string | null
  }>,
) {
  return resolvePublicEvent({
    _id: id,
    title: id,
    eventStatus: "scheduled",
    dates: dates.map(date => ({ ...date, endTime: null })),
  })
}

function buildCalendarMonths(
  events: ReturnType<typeof event>[],
  today: string,
) {
  return groupCalendarMonths(flattenPublicOccurrences(events), today)
}

describe("calendar event grouping", () => {
  it("hides dates before the current week while retaining this week's dates", () => {
    const months = buildCalendarMonths(
      [
        event("concert", [
          { _key: "past", startDate: "2026-08-20" },
          { _key: "this-week", startDate: "2026-08-24" },
          { _key: "future", startDate: "2026-09-03", startTime: "19:00" },
        ]),
      ],
      "2026-08-27",
    )

    expect(months).toHaveLength(2)
    expect(months[0]?.eventCount).toBe(1)
    expect(months[0]?.days[0]?.date).toBe("2026-08-24")
    expect(months[0]?.days[0]?.occurrences[0]?.schedule.startDate).toBe(
      "2026-08-24",
    )
    expect(months[1]?.eventCount).toBe(1)
    expect(months[1]?.days[2]?.occurrences[0]?.event._id).toBe("concert")
  })

  it("places each date from a multi-date event on its own day", () => {
    const months = buildCalendarMonths(
      [
        event("festival", [
          { _key: "one", startDate: "2026-09-01" },
          { _key: "two", startDate: "2026-09-02" },
        ]),
      ],
      "2026-09-01",
    )

    expect(months).toHaveLength(2)
    expect(months[1]?.eventCount).toBe(2)
    expect(months[1]?.days[0]?.occurrences).toHaveLength(1)
    expect(months[1]?.days[1]?.occurrences).toHaveLength(1)
  })

  it("keeps empty months between the current month and the last event", () => {
    const months = buildCalendarMonths(
      [event("winter-event", [{ _key: "one", startDate: "2026-11-12" }])],
      "2026-09-01",
    )

    expect(months.map(month => month.key)).toEqual([
      "2026-08",
      "2026-09",
      "2026-10",
      "2026-11",
    ])
    expect(months[2]?.eventCount).toBe(0)
  })

  it("uses a Monday-first leading offset", () => {
    const months = buildCalendarMonths(
      [event("event", [{ _key: "one", startDate: "2026-09-01" }])],
      "2026-09-01",
    )

    expect(months[1]?.leadingEmptyDays).toBe(1)
  })

  it("sorts events within a day by time and then stable event id", () => {
    const months = buildCalendarMonths(
      [
        event("late", [
          { _key: "late", startDate: "2026-09-01", startTime: "20:00" },
        ]),
        event("early", [
          { _key: "early", startDate: "2026-09-01", startTime: "18:00" },
        ]),
      ],
      "2026-09-01",
    )

    expect(
      months[1]?.days[0]?.occurrences.map(occurrence => occurrence.event._id),
    ).toEqual(["early", "late"])
  })
})
