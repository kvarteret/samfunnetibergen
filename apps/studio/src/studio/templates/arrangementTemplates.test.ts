import { describe, expect, it } from "vitest"

import {
  festivalDayInitialValue,
  localizedDefaults,
} from "./arrangementTemplates"

describe("festival day template", () => {
  it("prefills the festival relationship and editorial defaults", () => {
    expect(festivalDayInitialValue("drafts.festival-1")).toEqual({
      ...localizedDefaults(),
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

  it("starts every localized field with Norsk and English entries", () => {
    expect(localizedDefaults().localizedTitle).toEqual([
      {
        _key: "nb",
        _type: "internationalizedArrayStringValue",
        language: "nb",
      },
      {
        _key: "en",
        _type: "internationalizedArrayStringValue",
        language: "en",
      },
    ])
  })
})
