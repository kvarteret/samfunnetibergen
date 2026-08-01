import { describe, expect, it } from "vitest"

import { festivalDayInitialValue } from "./arrangementTemplates"

describe("festival day template", () => {
  it("prefills the festival relationship and editorial defaults", () => {
    expect(festivalDayInitialValue("drafts.festival-1")).toEqual({
      eventKind: "festivalSession",
      parentEvent: { _type: "reference", _ref: "festival-1" },
      approvalStatus: "approved",
      eventStatus: "scheduled",
      isPromoted: false,
      isRecurring: false,
      useFestivalImage: true,
      dates: [
        {
          _key: "festival-day-date",
          _type: "arrangementDate",
          startDate: "",
          startTime: "",
        },
      ],
    })
  })
})
