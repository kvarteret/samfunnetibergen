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
  extra: {
    eventKind?: string
    parent?: { _id: string; eventKind: string; title: string; slug: string }
  } = {},
) {
  return resolvePublicEvent({
    _id: id,
    title: id,
    eventStatus: "scheduled",
    ...extra,
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

describe("calendar festivals", () => {
  const parent = {
    _id: "festival",
    eventKind: "festivalParent",
    title: "festival",
    slug: "festival",
  }
  const festival = () =>
    event(
      "festival",
      [
        { _key: "a", startDate: "2026-09-03", startTime: "19:00" },
        { _key: "b", startDate: "2026-09-04", startTime: "19:00" },
        { _key: "c", startDate: "2026-09-04", startTime: "21:00" },
      ],
      { eventKind: "festivalParent" },
    )
  const session = (id: string, startDate: string) =>
    event(id, [{ _key: "d", startDate, startTime: "19:00" }], {
      eventKind: "festivalSession",
      parent,
    })

  it("shows a festival once, on its first day, without its sessions", () => {
    const months = buildCalendarMonths(
      [festival(), session("one", "2026-09-03"), session("two", "2026-09-04")],
      "2026-09-01",
    )
    const days = months.flatMap(month => month.days)
    const shown = days.flatMap(day =>
      day.occurrences.map(occurrence => [day.date, occurrence.event._id]),
    )

    expect(shown).toEqual([["2026-09-03", "festival"]])
  })

  it("keeps sessions whose festival is not in the stream", () => {
    const months = buildCalendarMonths(
      [session("one", "2026-09-03")],
      "2026-09-01",
    )
    const ids = months.flatMap(month =>
      month.days.flatMap(day => day.occurrences.map(o => o.event._id)),
    )

    expect(ids).toEqual(["one"])
  })
})

describe("calendar semester boundary", () => {
  it.each([
    ["2026-10-06", "2026-12-15", "2026-12-16", "2027-01-03"],
    ["2026-04-01", "2026-05-29", "2026-05-30", "2026-08-17"],
  ])(
    "ends the calendar at the current semester boundary for %s",
    (today, end, afterEnd, nextSemester) => {
      const months = buildCalendarMonths(
        [
          event("boundary", [{ _key: "one", startDate: end }]),
          event("later", [{ _key: "two", startDate: afterEnd }]),
          event("next-semester", [{ _key: "three", startDate: nextSemester }]),
        ],
        today,
      )

      expect(months.at(-1)?.days.at(-1)?.date).toBe(end)
      expect(months.reduce((count, month) => count + month.eventCount, 0)).toBe(
        1,
      )
      expect(
        months.flatMap(month => month.days).every(day => day.date <= end),
      ).toBe(true)
    },
  )

  it("shows no calendar when only next-semester events exist", () => {
    expect(
      buildCalendarMonths(
        [event("next-semester", [{ _key: "one", startDate: "2027-01-03" }])],
        "2026-10-06",
      ),
    ).toEqual([])
  })

  it.each(["2026-05-30", "2026-06-15", "2026-12-16"])(
    "shows no elapsed semester during the gap on %s",
    today => {
      expect(
        buildCalendarMonths(
          [
            event("past", [{ _key: "one", startDate: "2026-05-29" }]),
            event("winter", [{ _key: "two", startDate: "2026-12-15" }]),
            event("next", [{ _key: "three", startDate: "2027-01-03" }]),
          ],
          today,
        ),
      ).toEqual([])
    },
  )
})
