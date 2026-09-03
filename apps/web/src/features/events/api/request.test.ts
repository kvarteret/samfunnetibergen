import { describe, expect, it } from "vitest"

import {
  InvalidPublicEventsRequest,
  parsePublicEventDetailRequest,
  parsePublicEventsCollectionRequest,
} from "./request"

describe("public events request parsing", () => {
  it("defaults to Norwegian today-forward complete snapshot", () => {
    expect(
      parsePublicEventsCollectionRequest(
        "https://example.test/api/v1/events",
        "2026-09-01",
      ),
    ).toEqual({
      locale: "nb",
      from: "2026-09-01",
      to: null,
      includeInternal: false,
    })
  })

  it("keeps explicit inclusive date filters without pagination state", () => {
    const request = parsePublicEventsCollectionRequest(
      "https://example.test/api/v1/events?locale=en&to=2026-12-31&includeInternal=true",
      "2026-09-01",
    )

    expect(request).toMatchObject({
      locale: "en",
      from: "2026-09-01",
      to: "2026-12-31",
      includeInternal: true,
    })
  })

  it("rejects invalid dates, inverted ranges, and unsupported parameters", () => {
    for (const url of [
      "https://example.test/api/v1/events?from=2026-02-30",
      "https://example.test/api/v1/events?from=2026-10-01&to=2026-09-01",
      "https://example.test/api/v1/events?cursor=abc",
      "https://example.test/api/v1/events?limit=100",
    ]) {
      expect(() =>
        parsePublicEventsCollectionRequest(url, "2026-09-01"),
      ).toThrow(InvalidPublicEventsRequest)
    }
  })

  it("only treats the exact hidden internal switch as enabled", () => {
    expect(
      parsePublicEventsCollectionRequest(
        "https://example.test/api/v1/events?includeInternal=unexpected",
        "2026-09-01",
      ).includeInternal,
    ).toBe(false)
  })

  it("parses detail locale and preserves the hidden internal switch", () => {
    expect(
      parsePublicEventDetailRequest(
        "https://example.test/api/v1/events/old?locale=en&includeInternal=true",
      ),
    ).toEqual({ locale: "en", includeInternal: true })
  })

  it("rejects unsupported detail parameters", () => {
    expect(() =>
      parsePublicEventDetailRequest(
        "https://example.test/api/v1/events/old?limit=1",
      ),
    ).toThrow(InvalidPublicEventsRequest)
  })
})
