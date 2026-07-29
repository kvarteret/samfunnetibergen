import { describe, expect, it } from "vitest"

import {
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
]

describe("arrangement filters", () => {
  it("combines preset, date, taxonomy and search filters", () => {
    expect(
      filterArrangements(
        items,
        {
          ...defaultArrangementFilters("promoted"),
          date: "upcoming",
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
        { ...defaultArrangementFilters("recurring"), date: "past" },
        "2026-07-29",
      ).map(item => item._id),
    ).toEqual(["series"])
  })

  it("uses festivals as another preset over the same browser data", () => {
    expect(
      filterArrangements(
        items,
        defaultArrangementFilters("festivals"),
        "2026-07-29",
      ).map(item => item._id),
    ).toEqual(["festival"])
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
