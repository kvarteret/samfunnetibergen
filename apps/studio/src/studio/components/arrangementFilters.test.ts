import { describe, expect, it } from "vitest"

import {
  arrangementListStatus,
  countPendingRequests,
  deduplicatePreviewDocuments,
  defaultArrangementFilters,
  filterArrangements,
} from "./arrangementFilters"

const items = [
  {
    _id: "single",
    title: "Konsert",
    eventKind: "single",
    approvalStatus: "approved",
    eventStatus: "scheduled",
    isPromoted: true,
    dates: [{ startDate: "2026-08-02" }],
    eventType: {
      _id: "type-concert",
      name: "Konsert",
      taxonomyGroup: { _id: "music", name: "Musikk" },
    },
  },
  {
    _id: "series",
    title: "Quiz",
    eventKind: "seriesParent",
    approvalStatus: "approved",
    eventStatus: "scheduled",
    isRecurring: true,
    childDates: ["2026-07-01"],
  },
  {
    _id: "festival",
    title: "Festival",
    eventKind: "festivalParent",
    approvalStatus: "approved",
    eventStatus: "scheduled",
    childDates: ["2026-08-10", "2026-08-11"],
  },
  {
    _id: "child",
    title: "Skjult seriedag",
    eventKind: "seriesInstance",
    approvalStatus: "approved",
    dates: [{ startDate: "2026-08-03" }],
  },
  {
    _id: "completed",
    title: "Gjennomført konsert",
    eventKind: "single",
    approvalStatus: "approved",
    eventStatus: "scheduled",
    dates: [{ startDate: "2026-07-01" }],
  },
  {
    _id: "cancelled",
    title: "Kansellert konsert",
    eventKind: "single",
    approvalStatus: "approved",
    eventStatus: "cancelled",
    dates: [{ startDate: "2026-08-04" }],
  },
  {
    _id: "archived",
    title: "Arkivert konsert",
    eventKind: "single",
    approvalStatus: "approved",
    eventStatus: "scheduled",
    dates: [{ startDate: "2026-06-01" }],
  },
]

describe("arrangement filters", () => {
  it("combines format, date, taxonomy and search filters", () => {
    expect(
      filterArrangements(
        items,
        {
          ...defaultArrangementFilters(),
          format: "single",
          taxonomyGroupId: "music",
          query: "kon",
        },
        "2026-07-29",
      ).map(item => item._id),
    ).toEqual(["single"])
  })

  it("keeps generated children out and finds dry recurring series", () => {
    expect(
      filterArrangements(
        items,
        {
          ...defaultArrangementFilters(),
          format: "recurring",
          status: "completed",
        },
        "2026-07-29",
      ).map(item => item._id),
    ).toEqual(["series"])
  })

  it("filters festivals by format", () => {
    expect(
      filterArrangements(
        items,
        { ...defaultArrangementFilters(), format: "festivals" },
        "2026-07-29",
      ).map(item => item._id),
    ).toEqual(["festival"])
  })

  it("shows approved upcoming arrangements by default", () => {
    expect(defaultArrangementFilters()).toMatchObject({
      format: "all",
      status: "approved",
    })
  })

  it("assigns each arrangement to exactly one derived status", () => {
    const defaults = defaultArrangementFilters()

    expect(
      filterArrangements(
        items,
        { ...defaults, status: "completed" },
        "2026-07-29",
      ).map(item => item._id),
    ).toEqual(["completed", "series"])
    expect(
      filterArrangements(
        items,
        { ...defaults, status: "cancelled" },
        "2026-07-29",
      ).map(item => item._id),
    ).toEqual(["cancelled"])
    expect(
      filterArrangements(
        items,
        { ...defaults, status: "archived" },
        "2026-07-29",
      ).map(item => item._id),
    ).toEqual(["archived"])
  })

  it.each([
    ["future scheduled", { dates: [{ startDate: "2026-08-01" }] }, "approved"],
    ["today scheduled", { dates: [{ startDate: "2026-07-29" }] }, "approved"],
    [
      "past this half-year",
      { dates: [{ startDate: "2026-07-01" }] },
      "completed",
    ],
    [
      "past previous half-year",
      { dates: [{ startDate: "2026-06-30" }] },
      "archived",
    ],
    [
      "future cancelled",
      { eventStatus: "cancelled", dates: [{ startDate: "2026-08-01" }] },
      "cancelled",
    ],
    [
      "today cancelled",
      { eventStatus: "cancelled", dates: [{ startDate: "2026-07-29" }] },
      "cancelled",
    ],
    [
      "past cancelled",
      { eventStatus: "cancelled", dates: [{ startDate: "2026-07-28" }] },
      "archived",
    ],
    ["missing date", { dates: [] }, "approved"],
    [
      "missing cancelled date",
      { eventStatus: "cancelled", dates: [] },
      "cancelled",
    ],
  ])("derives %s", (_label, item, expected) => {
    expect(
      arrangementListStatus(
        { _id: "matrix", approvalStatus: "approved", ...item },
        "2026-07-29",
      ),
    ).toBe(expected)
  })

  it("switches half-years on January 1 and July 1", () => {
    expect(
      arrangementListStatus(
        { _id: "new-year", dates: [{ startDate: "2026-12-31" }] },
        "2027-01-01",
      ),
    ).toBe("archived")
    expect(
      arrangementListStatus(
        { _id: "summer", dates: [{ startDate: "2026-06-30" }] },
        "2026-07-01",
      ),
    ).toBe("archived")
  })

  it("uses the latest own or approved child date", () => {
    expect(
      arrangementListStatus(
        {
          _id: "multi",
          dates: [{ startDate: "2026-01-01" }],
          childDates: ["2026-07-28", "2026-08-02"],
        },
        "2026-07-29",
      ),
    ).toBe("approved")
  })

  it("prefers drafts while deduplicating preview results", () => {
    expect(
      deduplicatePreviewDocuments([
        { _id: "request", title: "Published" },
        { _id: "drafts.request", title: "Draft" },
      ]),
    ).toEqual([{ _id: "request", title: "Draft" }])
  })

  it("counts unique pending website requests", () => {
    expect(
      countPendingRequests([
        {
          _id: "request",
          approvalStatus: "pending",
          submittedByEmail: "a@example.com",
        },
        {
          _id: "drafts.request",
          approvalStatus: "pending",
          submittedByEmail: "a@example.com",
        },
        {
          _id: "internal",
          approvalStatus: "pending",
          submittedByEmail: null,
        },
      ]),
    ).toBe(1)
  })
})
