import { describe, expect, test } from "vitest"

import {
  buildInstanceDocument,
  diffInstances,
  type ExistingInstance,
  expandOccurrencesInRange,
  type GenerationParent,
  instanceIdFor,
  instanceSlugFor,
  occurrenceToken,
  publishedIdOf,
  semesterForCode,
  semesterForDate,
  semesterWindowsAround,
} from "./instances"

const parent: GenerationParent = {
  _id: "abc123",
  slug: "quiz-kvelden",
  approvalStatus: "approved",
}

const seed = { startDate: "2026-08-03", startTime: "19:00", endTime: "22:00" }

describe("expandOccurrences", () => {
  test("expands a weekly rule inside a range and copies seed times", () => {
    // Arrange: 2026-08-03 is a Monday
    const rule = "FREQ=WEEKLY;BYDAY=MO"

    // Act
    const occurrences = expandOccurrencesInRange(rule, seed, {
      startDate: "2026-08-03",
      endDate: "2026-08-24",
    })

    // Assert
    expect(occurrences.map(o => o.startDate)).toEqual([
      "2026-08-03",
      "2026-08-10",
      "2026-08-17",
      "2026-08-24",
    ])
    expect(occurrences[0]).toEqual({
      startDate: "2026-08-03",
      startTime: "19:00",
      endTime: "22:00",
    })
  })

  test("expands biweekly and monthly rules", () => {
    const biweekly = expandOccurrencesInRange(
      "FREQ=WEEKLY;INTERVAL=2;BYDAY=MO",
      seed,
      { startDate: "2026-08-03", endDate: "2026-08-31" },
    )
    expect(biweekly.map(o => o.startDate)).toEqual([
      "2026-08-03",
      "2026-08-17",
      "2026-08-31",
    ])

    const monthly = expandOccurrencesInRange("FREQ=MONTHLY", seed, {
      startDate: "2026-08-03",
      endDate: "2026-10-03",
    })
    expect(monthly.map(o => o.startDate)).toEqual([
      "2026-08-03",
      "2026-09-03",
      "2026-10-03",
    ])
  })

  test("ignores legacy COUNT and UNTIL because the range is authoritative", () => {
    const occurrences = expandOccurrencesInRange(
      "FREQ=WEEKLY;BYDAY=MO;COUNT=1;UNTIL=20260803T235959Z",
      seed,
      { startDate: "2026-08-03", endDate: "2026-08-24" },
    )
    expect(occurrences.map(occurrence => occurrence.startDate)).toEqual([
      "2026-08-03",
      "2026-08-10",
      "2026-08-17",
      "2026-08-24",
    ])
  })

  test("keeps the weekday across the October DST transition in Oslo", () => {
    // Oslo leaves CEST on 2026-10-25. Mondays before and after must stay Mondays.
    const occurrences = expandOccurrencesInRange(
      "FREQ=WEEKLY;BYDAY=MO",
      {
        startDate: "2026-10-05",
        startTime: "19:00",
        endTime: null,
      },
      { startDate: "2026-10-05", endDate: "2027-01-04" },
    )

    for (const occurrence of occurrences) {
      const day = new Date(`${occurrence.startDate}T12:00:00Z`).getUTCDay()
      expect(day).toBe(1)
    }
    expect(occurrences.map(o => o.startDate)).toContain("2026-10-26")
  })

  test("keeps the weekday across the March DST transition in Oslo", () => {
    // Oslo enters CEST on 2027-03-28.
    const occurrences = expandOccurrencesInRange(
      "FREQ=WEEKLY;BYDAY=MO",
      {
        startDate: "2027-03-15",
        startTime: null,
        endTime: null,
      },
      { startDate: "2027-03-15", endDate: "2027-04-19" },
    )

    expect(occurrences.map(o => o.startDate)).toEqual([
      "2027-03-15",
      "2027-03-22",
      "2027-03-29",
      "2027-04-05",
      "2027-04-12",
      "2027-04-19",
    ])
  })

  test("returns empty for invalid rules and invalid seed dates", () => {
    expect(
      expandOccurrencesInRange("NOT-A-RULE", seed, {
        startDate: "2026-08-03",
        endDate: "2026-08-24",
      }),
    ).toEqual([])
    expect(
      expandOccurrencesInRange(
        "FREQ=WEEKLY",
        { startDate: "not-a-date" },
        { startDate: "2026-08-03", endDate: "2026-08-24" },
      ),
    ).toEqual([])
  })
})

describe("semester-focused expansion", () => {
  test("uses the configured program windows and compact labels", () => {
    expect(semesterForDate("2026-01-03")).toMatchObject({
      code: "V26",
      label: "V26",
      startDate: "2026-01-03",
      endDate: "2026-05-29",
    })
    expect(semesterForDate("2026-08-17")).toMatchObject({
      code: "H26",
      label: "H26",
      startDate: "2026-08-17",
      endDate: "2026-12-15",
    })
    expect(semesterForDate("2026-07-29")?.code).toBe("H26")
    expect(semesterForCode("V26")).toMatchObject({
      code: "V26",
      startDate: "2026-01-03",
      endDate: "2026-05-29",
    })
    expect(semesterForCode("h26")).toMatchObject({
      code: "H26",
      startDate: "2026-08-17",
      endDate: "2026-12-15",
    })
    expect(semesterForCode("X26")).toBeNull()
    expect(semesterForDate("not-a-date")).toBeNull()
    expect(semesterForDate("2026-13-01")).toBeNull()
  })

  test("lists one previous and two following semesters", () => {
    expect(
      semesterWindowsAround("2026-07-29").map(semester => semester.code),
    ).toEqual(["V26", "H26", "V27", "H27"])
    expect(semesterWindowsAround("not-a-date")).toEqual([])
  })

  test("expands an unbounded rule only inside the selected semester", () => {
    const occurrences = expandOccurrencesInRange("FREQ=WEEKLY;BYDAY=MO", seed, {
      startDate: "2027-01-03",
      endDate: "2027-05-29",
    })

    expect(occurrences[0]?.startDate).toBe("2027-01-04")
    expect(occurrences.at(-1)?.startDate).toBe("2027-05-24")
  })

  test("ignores COUNT and UNTIL inside a selected semester", () => {
    const secondSemester = {
      startDate: "2026-08-17",
      endDate: "2026-12-15",
    }
    expect(
      expandOccurrencesInRange(
        "FREQ=WEEKLY;BYDAY=MO;COUNT=3",
        seed,
        secondSemester,
      ).map(occurrence => occurrence.startDate),
    ).toEqual([
      "2026-08-17",
      "2026-08-24",
      "2026-08-31",
      "2026-09-07",
      "2026-09-14",
      "2026-09-21",
      "2026-09-28",
      "2026-10-05",
      "2026-10-12",
      "2026-10-19",
      "2026-10-26",
      "2026-11-02",
      "2026-11-09",
      "2026-11-16",
      "2026-11-23",
      "2026-11-30",
      "2026-12-07",
      "2026-12-14",
    ])
    expect(
      expandOccurrencesInRange(
        "FREQ=WEEKLY;BYDAY=MO;UNTIL=20260817T235959Z",
        seed,
        secondSemester,
      ).map(occurrence => occurrence.startDate),
    ).toHaveLength(18)
  })

  test("returns no dates for invalid or pre-seed windows", () => {
    expect(
      expandOccurrencesInRange("FREQ=WEEKLY", seed, {
        startDate: "2026-01-03",
        endDate: "2026-05-29",
      }),
    ).toEqual([])
    expect(
      expandOccurrencesInRange("FREQ=WEEKLY", seed, {
        startDate: "invalid",
        endDate: "2026-12-15",
      }),
    ).toEqual([])
    expect(
      expandOccurrencesInRange("FREQ=WEEKLY", seed, {
        startDate: "2026-12-15",
        endDate: "2026-08-17",
      }),
    ).toEqual([])
  })
})

describe("deterministic identity", () => {
  test("token includes the start time when present", () => {
    expect(
      occurrenceToken({
        startDate: "2026-08-03",
        startTime: "19:00",
        endTime: null,
      }),
    ).toBe("2026-08-03-1900")
    expect(
      occurrenceToken({
        startDate: "2026-08-03",
        startTime: null,
        endTime: null,
      }),
    ).toBe("2026-08-03")
  })

  test("two same-day occurrences with different times get distinct ids and slugs", () => {
    const matinee = {
      startDate: "2026-08-03",
      startTime: "13:00",
      endTime: null,
    }
    const evening = {
      startDate: "2026-08-03",
      startTime: "19:00",
      endTime: null,
    }

    expect(instanceIdFor(parent._id, matinee)).toBe(
      "arrangement-abc123-2026-08-03-1300",
    )
    expect(instanceIdFor(parent._id, evening)).toBe(
      "arrangement-abc123-2026-08-03-1900",
    )
    expect(instanceSlugFor(parent.slug, matinee)).toBe(
      "quiz-kvelden-2026-08-03-1300",
    )
    expect(instanceSlugFor(parent.slug, evening)).not.toBe(
      instanceSlugFor(parent.slug, matinee),
    )
  })

  test("draft and published parent ids yield the same child id", () => {
    expect(publishedIdOf("drafts.abc123")).toBe("abc123")
    expect(
      instanceIdFor("drafts.abc123", {
        startDate: "2026-08-03",
        startTime: null,
        endTime: null,
      }),
    ).toBe(
      instanceIdFor("abc123", {
        startDate: "2026-08-03",
        startTime: null,
        endTime: null,
      }),
    )
  })
})

describe("buildInstanceDocument", () => {
  test("builds a complete child with no inheritable content fields", () => {
    const occurrence = {
      startDate: "2026-08-10",
      startTime: "19:00",
      endTime: "22:00",
    }

    const doc = buildInstanceDocument(parent, occurrence)

    expect(doc).toEqual({
      _id: "arrangement-abc123-2026-08-10-1900",
      _type: "arrangement",
      eventKind: "seriesInstance",
      parentEvent: { _type: "reference", _ref: "abc123" },
      slug: { _type: "slug", current: "quiz-kvelden-2026-08-10-1900" },
      dates: [
        {
          _key: "2026-08-10-1900",
          _type: "arrangementDate",
          startDate: "2026-08-10",
          startTime: "19:00",
          endTime: "22:00",
        },
      ],
      eventStatus: "scheduled",
      approvalStatus: "approved",
    })
    expect(doc).not.toHaveProperty("title")
    expect(doc).not.toHaveProperty("isFree")
  })

  test("children of a non-approved parent are created pending", () => {
    const pendingParent: GenerationParent = {
      ...parent,
      approvalStatus: "pending",
    }
    const doc = buildInstanceDocument(pendingParent, {
      startDate: "2026-08-10",
      startTime: null,
      endTime: null,
    })
    expect(doc.approvalStatus).toBe("pending")
    expect(doc.dates[0]).not.toHaveProperty("startTime")
  })
})

describe("diffInstances", () => {
  const occurrenceA = {
    startDate: "2026-08-03",
    startTime: "19:00",
    endTime: null,
  }
  const occurrenceB = {
    startDate: "2026-08-10",
    startTime: "19:00",
    endTime: null,
  }

  function existingFor(
    occurrence: typeof occurrenceA,
    overrides: Partial<ExistingInstance> = {},
  ): ExistingInstance {
    return {
      _id: instanceIdFor(parent._id, occurrence),
      eventStatus: "scheduled",
      approvalStatus: "approved",
      dates: [occurrence],
      hasContentOverrides: false,
      ...overrides,
    }
  }

  test("rerunning with an unchanged rule is a no-op", () => {
    const planned = [occurrenceA, occurrenceB]
    const existing = [existingFor(occurrenceA), existingFor(occurrenceB)]

    const diff = diffInstances(parent, planned, existing)

    expect(diff.toCreate).toEqual([])
    expect(diff.orphanedUntouched).toEqual([])
    expect(diff.orphanedEdited).toEqual([])
  })

  test("plans creation only for missing occurrences", () => {
    const diff = diffInstances(
      parent,
      [occurrenceA, occurrenceB],
      [existingFor(occurrenceA)],
    )
    expect(diff.toCreate).toEqual([occurrenceB])
  })

  test("classifies a pristine no-longer-planned child as untouched", () => {
    const diff = diffInstances(
      parent,
      [occurrenceB],
      [existingFor(occurrenceA)],
    )
    expect(diff.orphanedUntouched.map(i => i._id)).toEqual([
      instanceIdFor(parent._id, occurrenceA),
    ])
    expect(diff.orphanedEdited).toEqual([])
  })

  test("a cancelled orphan is never classified untouched", () => {
    const diff = diffInstances(
      parent,
      [occurrenceB],
      [existingFor(occurrenceA, { eventStatus: "cancelled" })],
    )
    expect(diff.orphanedUntouched).toEqual([])
    expect(diff.orphanedEdited).toHaveLength(1)
  })

  test("content overrides and changed dates mark an orphan as edited", () => {
    const overridden = existingFor(occurrenceA, { hasContentOverrides: true })
    const rescheduled = existingFor(occurrenceB, {
      _id: instanceIdFor(parent._id, occurrenceB),
      dates: [{ startDate: "2026-08-11", startTime: "19:00", endTime: null }],
    })

    const diff = diffInstances(parent, [], [overridden, rescheduled])

    expect(diff.orphanedEdited).toHaveLength(2)
    expect(diff.orphanedUntouched).toEqual([])
  })

  test("an orphaned end-time edit is detected when the seed is provided", () => {
    const endTimeEdited = existingFor(occurrenceA, {
      dates: [{ ...occurrenceA, endTime: "23:30" }],
    })

    const withSeed = diffInstances(parent, [], [endTimeEdited], {
      startDate: "2026-08-03",
      startTime: "19:00",
      endTime: null,
    })

    expect(withSeed.orphanedEdited).toHaveLength(1)
    expect(withSeed.orphanedUntouched).toEqual([])
  })

  test("an orphan whose approval differs from what generation would set is edited", () => {
    const diff = diffInstances(
      parent,
      [],
      [existingFor(occurrenceA, { approvalStatus: "rejected" })],
    )
    expect(diff.orphanedEdited).toHaveLength(1)
  })

  test("plans public replacement for legacy dotted private ids", () => {
    const legacyPrivateInstance = existingFor(occurrenceA, {
      _id: "arrangement.abc123.2026-08-03-1900",
    })

    const diff = diffInstances(parent, [occurrenceA], [legacyPrivateInstance])

    expect(diff.toCreate).toEqual([occurrenceA])
    expect(diff.orphanedUntouched).toEqual([legacyPrivateInstance])
    expect(diff.orphanedEdited).toEqual([])
  })
})
