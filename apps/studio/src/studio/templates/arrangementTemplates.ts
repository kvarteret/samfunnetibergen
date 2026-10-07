const LOCALIZED_FIELDS = {
  localizedTitle: "internationalizedArrayStringValue",
  localizedDescription: "internationalizedArrayPortableTextContentValue",
  localizedImageCaption: "internationalizedArrayStringValue",
  localizedRoomText: "internationalizedArrayStringValue",
  localizedOrganizerText: "internationalizedArrayStringValue",
} as const

/**
 * Empty Norsk/English entries, so the internationalized-array plugin has
 * nothing to add on open and a new arrangement is not saved until edited.
 */
export function localizedDefaults() {
  return Object.fromEntries(
    Object.entries(LOCALIZED_FIELDS).map(([field, type]) => [
      field,
      ["nb", "en"].map(language => ({
        _key: language,
        _type: type,
        language,
      })),
    ]),
  )
}

export function festivalDayInitialValue(parentId: string) {
  return {
    ...localizedDefaults(),
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
