import { describe, expect, it } from "vitest"
import {
  contentPageViewProperties,
  eventTrackingAttributes,
  groupTrackingAttributes,
  roomTrackingAttributes,
} from "./tracking-attributes"

describe("tracking attributes", () => {
  it("identifies event links independently of their DOM position", () => {
    expect(
      eventTrackingAttributes(
        { _id: "event-123", slug: "example-event" },
        "card-title",
      ),
    ).toEqual({
      "data-event-id": "event-123",
      "data-event-slug": "example-event",
      "data-event-surface": "card-title",
    })
  })

  it("identifies group links independently of their DOM position", () => {
    expect(
      groupTrackingAttributes(
        { _id: "group-123", slug: "example-group" },
        "groups-card",
      ),
    ).toEqual({
      "data-group-id": "group-123",
      "data-group-slug": "example-group",
      "data-group-surface": "groups-card",
    })
  })

  it("builds stable content page-view properties", () => {
    expect(
      contentPageViewProperties(
        { _id: "room-123", slug: "stillhet", title: "Stillhet" },
        "room",
        "nb",
      ),
    ).toEqual({
      content_id: "room-123",
      content_slug: "stillhet",
      content_title: "Stillhet",
      content_type: "room",
      locale: "nb",
    })
  })

  it("identifies room links independently of their DOM position", () => {
    expect(
      roomTrackingAttributes(
        { _id: "room-123", slug: "stillhet" },
        "room-detail",
      ),
    ).toEqual({
      "data-room-id": "room-123",
      "data-room-slug": "stillhet",
      "data-room-surface": "room-detail",
    })
  })
})
