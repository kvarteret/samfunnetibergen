import { describe, expect, it } from "vitest"

import {
  flattenPublicOccurrences,
  type RawPublicEvent,
  resolvePublicEvent,
} from "../domain/public-events"
import {
  addDuplicateTicketUrlInfo,
  assessBroadcastReadiness,
} from "./broadcast-readiness"

const baseEvent: RawPublicEvent = {
  _id: "event-1",
  _updatedAt: "2026-09-01T10:00:00.000Z",
  eventKind: "single",
  eventStatus: "scheduled",
  slug: "event-1",
  title: "Event",
  imageUrl: "https://cdn.example.test/event.jpg",
  eventType: {
    _id: "concert",
    name: "Concert",
    taxonomyGroup: { _id: "music", name: "Music" },
  },
  room: {
    _id: "room-1",
    title: "Teglverket",
    slug: "teglverket",
    floor: 1,
    imageUrl: null,
  },
  isFree: false,
  ticketUrl: "https://tickets.example.test/event",
  dates: [
    {
      _key: "date-1",
      startDate: "2026-09-02",
      startTime: "21:00",
      endTime: "02:30",
    },
  ],
}

function occurrence(
  overrides: Partial<RawPublicEvent> = {},
  id = baseEvent._id,
) {
  const event = resolvePublicEvent({ ...baseEvent, ...overrides, _id: id })
  return flattenPublicOccurrences([event])[0]!
}

const options = {
  siteUrl: "https://www.samfunnetibergen.no",
  locale: "nb" as const,
}

describe("Broadcast readiness", () => {
  it("accepts a complete ticketed occurrence and keeps UTC overnight output", () => {
    const result = assessBroadcastReadiness(occurrence(), options)

    expect(result).toEqual({
      occurrenceId: "occurrence:event-1:date-1",
      websiteUrl: "https://www.samfunnetibergen.no/nb/arrangementer/event-1",
      ready: true,
      issues: [],
      info: [],
    })
    expect(occurrence().schedule.endsAt).toBe("2026-09-03T00:30:00.000Z")
  })

  it("reports incomplete fields without inventing a location or time", () => {
    const result = assessBroadcastReadiness(
      occurrence({
        title: null,
        imageUrl: null,
        eventType: null,
        room: null,
        roomText: "Litteraturhuset",
        ticketUrl: null,
        dates: [
          {
            _key: "date-1",
            startDate: "2026-09-02",
            startTime: null,
            endTime: null,
          },
        ],
      }),
      options,
    )

    expect(result.issues).toEqual([
      "missing_title",
      "missing_start_time",
      "missing_end_time",
      "missing_image",
      "missing_keyword",
      "missing_ticket_url",
      "unmapped_location",
    ])
    expect(result.ready).toBe(false)
  })

  it("reports duplicate ticket URLs as information, never as duplicate occurrences", () => {
    const first = occurrence()
    const second = occurrence({ _id: "event-2", slug: "event-2" }, "event-2")
    const firstResult = assessBroadcastReadiness(first, options)
    const secondResult = assessBroadcastReadiness(second, options)
    const results = addDuplicateTicketUrlInfo(
      [first, second],
      [firstResult, secondResult],
    )

    expect(results.map(result => result.occurrenceId)).toEqual([
      "occurrence:event-1:date-1",
      "occurrence:event-2:date-1",
    ])
    expect(results.every(result => result.info.length > 0)).toBe(true)
    expect(results.map(result => result.info)).toEqual([
      ["duplicate_ticket_url"],
      ["duplicate_ticket_url"],
    ])
  })

  it("uses inherited public fields and does not flag cancellation", () => {
    const child = resolvePublicEvent({
      ...baseEvent,
      _id: "child-1",
      eventKind: "seriesInstance",
      title: null,
      imageUrl: null,
      eventType: null,
      isFree: null,
      ticketUrl: null,
      eventStatus: "scheduled",
      parent: {
        _id: "parent-1",
        eventKind: "seriesParent",
        eventStatus: "cancelled",
        title: "Series",
        imageUrl: "https://cdn.example.test/series.jpg",
        eventType: baseEvent.eventType,
        isFree: false,
        ticketUrl: baseEvent.ticketUrl,
      },
    })
    const result = assessBroadcastReadiness(
      flattenPublicOccurrences([child])[0]!,
      options,
    )

    expect(child.eventStatus).toBe("cancelled")
    expect(child.title).toBe("Series")
    expect(result.issues).toEqual([])
  })
})
