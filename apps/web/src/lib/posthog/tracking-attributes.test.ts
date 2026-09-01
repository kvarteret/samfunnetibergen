import { describe, expect, it } from "vitest"
import {
  eventTrackingAttributes,
  groupTrackingAttributes,
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
})
