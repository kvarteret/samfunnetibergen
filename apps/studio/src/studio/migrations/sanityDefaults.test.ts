import { describe, expect, it } from "vitest"

import { buildDefaultPatch, findRequiredViolations } from "./sanityDefaults"

describe("Sanity default migration", () => {
  it("backfills only missing arrangement defaults", () => {
    const patch = buildDefaultPatch({
      _id: "event-1",
      _type: "arrangement",
      isFree: true,
    })

    expect(patch).toEqual({
      approvalStatus: "pending",
      eventStatus: "scheduled",
      isInternalEvent: false,
      isPromoted: false,
      isRecurring: false,
    })
  })

  it("is idempotent after defaults are present", () => {
    expect(
      buildDefaultPatch({
        _id: "room-1",
        _type: "room",
        hasAV: false,
        hasLighting: false,
        hasSound: false,
        images: [],
        suitedPurposes: [],
      }),
    ).toEqual({})
  })

  it("preserves meaningful optional fields", () => {
    expect(
      buildDefaultPatch({
        _id: "room-1",
        _type: "room",
        panoramaUrl: null,
      }),
    ).not.toHaveProperty("panoramaUrl")
  })

  it("replaces explicit null defaults and becomes idempotent", () => {
    const patch = buildDefaultPatch({
      _id: "room-1",
      _type: "room",
      hasSound: null,
      images: null,
    })

    expect(patch).toMatchObject({ hasSound: false, images: [] })
    expect(
      buildDefaultPatch({
        _id: "room-1",
        _type: "room",
        ...patch,
      }),
    ).not.toHaveProperty("hasSound")
  })

  it.each([
    ["footer", "socialLinks"],
    ["groupsPage", "faq"],
    ["linkInBio", "links"],
    ["roomsPage", "floorPlans"],
    ["siteMetadata", "houseClosedDates"],
    ["sponsorsPage", "sponsors"],
    ["studentGroup", "labels"],
  ])("normalizes %s collections", (type, field) => {
    expect(buildDefaultPatch({ _id: `${type}-1`, _type: type })).toHaveProperty(
      field,
      [],
    )
  })

  it("does nothing for document types without storage defaults", () => {
    expect(buildDefaultPatch({ _id: "page-1", _type: "page" })).toEqual({})
  })
})

describe("required content audit", () => {
  it("reports required room values without treating optional media as invalid", () => {
    expect(
      findRequiredViolations({
        _id: "room-1",
        _type: "room",
        title: "",
        summary: "Summary",
        slug: {},
        images: null,
      }),
    ).toEqual(["title", "slug.current"])
  })

  it("accepts a complete arrangement", () => {
    expect(
      findRequiredViolations({
        _id: "event-1",
        _type: "arrangement",
        title: "Event",
        slug: { current: "event" },
        dates: [{ startDate: "2026-06-12" }],
        approvalStatus: "approved",
        eventStatus: "scheduled",
      }),
    ).toEqual([])
  })

  it("reports incomplete arrangement dates", () => {
    expect(
      findRequiredViolations({
        _id: "event-1",
        _type: "arrangement",
        title: "Event",
        slug: { current: "event" },
        dates: [{}],
      }),
    ).toEqual(["approvalStatus", "eventStatus", "dates[].startDate"])
  })

  it.each([
    [
      { _id: "group-1", _type: "studentGroup" },
      ["name", "summary", "category", "slug.current"],
    ],
    [{ _id: "page-1", _type: "page" }, ["title", "slug.current"]],
    [{ _id: "homePage", _type: "homePage" }, ["title"]],
    [{ _id: "linkInBio", _type: "linkInBio" }, ["heading"]],
    [
      { _id: "type-1", _type: "eventType" },
      ["name", "slug.current", "taxonomyGroup"],
    ],
    [
      { _id: "taxonomy-1", _type: "eventTaxonomyGroup" },
      ["name", "slug.current"],
    ],
    [
      { _id: "benefit-1", _type: "internbevisBenefit" },
      ["name", "minimumTier"],
    ],
    [{ _id: "navbar", _type: "navbar", items: [] }, ["items"]],
  ])("audits required values for $._type", (document, expected) => {
    expect(findRequiredViolations(document)).toEqual(expected)
  })

  it("audits required nested values", () => {
    expect(
      findRequiredViolations({
        _id: "footer",
        _type: "footer",
        socialLinks: [{ platform: "", label: "Instagram" }],
      }),
    ).toEqual(["socialLinks[0].platform", "socialLinks[0].url"])
  })

  it("audits nested navigation labels and groups", () => {
    expect(
      findRequiredViolations({
        _id: "navbar",
        _type: "navbar",
        items: [
          {
            label: "",
            children: [{ items: [] }, { items: [{ label: "" }] }],
          },
        ],
      }),
    ).toEqual([
      "items[0].label",
      "items[0].children[0].items",
      "items[0].children[1].items[0].label",
    ])
  })

  it("audits contact groups and people", () => {
    expect(
      findRequiredViolations({
        _id: "kontaktPage",
        _type: "kontaktPage",
        contactGroups: [{ title: "", persons: [{ name: "" }] }],
      }),
    ).toEqual(["contactGroups[0].title", "contactGroups[0].persons[0].name"])
  })

  it("audits closed dates, floor plans, and sponsors", () => {
    expect(
      findRequiredViolations({
        _id: "siteMetadata",
        _type: "siteMetadata",
        houseClosedDates: [{}],
      }),
    ).toEqual(["houseClosedDates[0].date"])

    expect(
      findRequiredViolations({
        _id: "roomsPage",
        _type: "roomsPage",
        title: "Rom",
        floorPlans: [{}],
      }),
    ).toEqual(["floorPlans[0].floor", "floorPlans[0].file"])

    expect(
      findRequiredViolations({
        _id: "sponsorsPage",
        _type: "sponsorsPage",
        title: "Sponsorer",
        sponsors: [{}],
      }),
    ).toEqual(["sponsors[0].title"])
  })

  it("accepts complete nested required values", () => {
    expect(
      findRequiredViolations({
        _id: "roomsPage",
        _type: "roomsPage",
        title: "Rom",
        floorPlans: [{ floor: 1, file: { asset: { _ref: "file-1" } } }],
      }),
    ).toEqual([])
  })
})
