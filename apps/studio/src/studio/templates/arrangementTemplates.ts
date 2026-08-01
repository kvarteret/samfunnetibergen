export function festivalDayInitialValue(parentId: string) {
  return {
    eventKind: "festivalSession",
    parentEvent: {
      _type: "reference",
      _ref: parentId.replace(/^drafts\./, ""),
    },
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
  }
}
