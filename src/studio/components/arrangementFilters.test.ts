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
  {
    _id: "archived",
    title: "Arkivert konsert",
    eventKind: "single",
    approvalStatus: "archived",
    eventStatus: "scheduled",
    dates: [{ startDate: "2026-06-01" }],
  },
  {
    _id: "cancelled",
    title: "Avlyst konsert",
    eventKind: "single",
    approvalStatus: "approved",
    eventStatus: "cancelled",
    dates: [{ startDate: "2026-08-04" }],
  },
  {
    _id: "hidden-cancelled",
    title: "Skjult avlyst konsert",
    eventKind: "single",
    approvalStatus: "paused",
    eventStatus: "cancelled",
    dates: [{ startDate: "2026-08-05" }],
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
          status: "all",
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
        {
          ...defaultArrangementFilters(),
          date: "past",
          format: "recurring",
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
      date: "upcoming",
      format: "all",
      status: "approved",
    })
  })

  it("uses the date and status filters instead of an archive view", () => {
    const filters = {
      ...defaultArrangementFilters(),
      date: "past" as const,
      status: "all" as const,
    }

    expect(filters).toMatchObject({
      date: "past",
      status: "all",
    })
    expect(
      filterArrangements(items, filters, "2026-07-29").map(item => item._id),
    ).toEqual(["archived", "series"])
  })

  it("assigns each arrangement to one combined status", () => {
    const defaults = defaultArrangementFilters()

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
        { ...defaults, status: "paused" },
        "2026-07-29",
      ).map(item => item._id),
    ).toEqual(["hidden-cancelled"])
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
