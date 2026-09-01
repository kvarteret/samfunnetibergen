import { describe, expect, it } from "vitest"

import {
  InvalidPublicEventsRequest,
  parsePublicEventDetailRequest,
  parsePublicEventsCollectionRequest,
  publicEventsUrl,
} from "./request"

describe("public events request parsing", () => {
  it("defaults to Norwegian today-forward unpaginated mode", () => {
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
      cursor: null,
      paginated: false,
    })
  })

  it("uses a fixed-range page mode when either date bound is explicit", () => {
    const request = parsePublicEventsCollectionRequest(
      "https://example.test/api/v1/events?locale=en&to=2026-12-31&includeInternal=true",
      "2026-09-01",
    )

    expect(request).toMatchObject({
      locale: "en",
      from: "2026-09-01",
      to: "2026-12-31",
      includeInternal: true,
      paginated: true,
    })
  })

  it("rejects invalid dates, inverted ranges, and cursors in default mode", () => {
    for (const url of [
      "https://example.test/api/v1/events?from=2026-02-30",
      "https://example.test/api/v1/events?from=2026-10-01&to=2026-09-01",
      "https://example.test/api/v1/events?cursor=abc",
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

  it("builds canonical next links without trusting the request host", () => {
    const request = parsePublicEventsCollectionRequest(
      "https://attacker.test/api/v1/events?locale=en&from=2026-09-01&to=2026-12-31",
      "2026-09-01",
    )

    expect(
      publicEventsUrl(
        "https://www.samfunnetibergen.no",
        request,
        "cursor-token",
      ),
    ).toBe(
      "https://www.samfunnetibergen.no/api/v1/events?locale=en&from=2026-09-01&to=2026-12-31&cursor=cursor-token",
    )
  })
})
