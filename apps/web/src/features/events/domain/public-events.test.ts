import { describe, expect, it } from "vitest"

import {
  flattenPublicOccurrences,
  normalizePublicSchedule,
  type PublicEventDate,
  resolvePublicEvent,
} from "./public-events"

const date = (
  startDate: string,
  startTime: string | null,
  endTime: string | null,
  _key = startDate,
): PublicEventDate => ({ _key, startDate, startTime, endTime })

describe("public event domain", () => {
  it("resolves inherited content and combines parent cancellation", () => {
    const event = resolvePublicEvent({
      _id: "event-child",
      _updatedAt: "2026-09-02T10:00:00.000Z",
      eventKind: "seriesInstance",
      eventStatus: "scheduled",
      parent: {
        _id: "event-parent",
        _updatedAt: "2026-09-03T10:00:00.000Z",
        eventKind: "seriesParent",
        eventStatus: "cancelled",
        slug: "series",
        title: "Inherited title",
        imageUrl: "https://cdn.example.test/parent.jpg",
        isFree: true,
      },
      slug: "series-day",
      title: null,
      description: [],
      imageUrl: null,
      room: null,
      roomText: "Lille sal",
      dates: [date("2026-09-10", "18:00", "20:00")],
      isFree: null,
    })

    expect(event.title).toBe("Inherited title")
    expect(event.imageUrl).toBe("https://cdn.example.test/parent.jpg")
    expect(event.isFree).toBe(true)
    expect(event.eventStatus).toBe("cancelled")
    expect(event.parentEvent).toMatchObject({
      _id: "event-parent",
      title: "Inherited title",
    })
    expect(event.effectiveUpdatedAt).toBe("2026-09-03T10:00:00.000Z")
  })

  it("does not inherit a location or a disabled festival image", () => {
    const event = resolvePublicEvent({
      _id: "festival-session",
      _updatedAt: "2026-09-02T10:00:00.000Z",
      eventKind: "festivalSession",
      eventStatus: "scheduled",
      parent: {
        _id: "festival-parent",
        eventKind: "festivalParent",
        eventStatus: "scheduled",
        slug: "festival",
        title: "Festival",
        imageUrl: "https://cdn.example.test/festival.jpg",
        room: {
          _id: "room-parent",
          title: "Main room",
          slug: "main-room",
          floor: 1,
          imageUrl: null,
        },
      },
      slug: "festival-session",
      title: "Session",
      useFestivalImage: false,
      room: null,
      dates: [date("2026-09-12", null, null)],
    })

    expect(event.imageUrl).toBeNull()
    expect(event.room).toBeNull()
  })
})

describe("public occurrence schedules", () => {
  it("normalizes overnight Oslo times onto the following date", () => {
    const schedule = normalizePublicSchedule(
      date("2026-10-25", "21:00", "02:30"),
    )

    expect(schedule).toEqual({
      startDate: "2026-10-25",
      startTime: "21:00",
      endDate: "2026-10-26",
      endTime: "02:30",
      startsAt: "2026-10-25T20:00:00.000Z",
      endsAt: "2026-10-26T01:30:00.000Z",
      timeZone: "Europe/Oslo",
    })
  })

  it("keeps date-only entries date-only", () => {
    const schedule = normalizePublicSchedule(date("2026-09-12", null, null))

    expect(schedule.startDate).toBe("2026-09-12")
    expect(schedule.endDate).toBeNull()
    expect(schedule.startsAt).toBeNull()
    expect(schedule.endsAt).toBeNull()
  })

  it("flattens every matching date in global stable order", () => {
    const first = resolvePublicEvent({
      _id: "event-b",
      eventKind: "single",
      eventStatus: "scheduled",
      slug: "b",
      dates: [
        date("2026-09-15", "19:00", "20:00", "b-late"),
        date("2026-09-10", "19:00", "20:00", "b-early"),
      ],
    })
    const second = resolvePublicEvent({
      _id: "event-a",
      eventKind: "single",
      eventStatus: "scheduled",
      slug: "a",
      dates: [date("2026-09-10", null, null, "a-date-only")],
    })

    const occurrences = flattenPublicOccurrences([first, second], {
      from: "2026-09-10",
      to: "2026-09-15",
    })

    expect(occurrences.map(occurrence => occurrence.id)).toEqual([
      "occurrence:event-b:b-early",
      "occurrence:event-a:a-date-only",
      "occurrence:event-b:b-late",
    ])
  })

  it("creates distinct fallback identities for keyless dates on the same day", () => {
    const event = resolvePublicEvent({
      _id: "event-keyless",
      eventStatus: "scheduled",
      dates: [
        { startDate: "2026-09-10", startTime: "18:00" },
        { startDate: "2026-09-10", startTime: "20:00" },
      ],
    })

    expect(flattenPublicOccurrences([event]).map(item => item.id)).toEqual([
      "occurrence:event-keyless:2026-09-10-0",
      "occurrence:event-keyless:2026-09-10-1",
    ])
  })
})
