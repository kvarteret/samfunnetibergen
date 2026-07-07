import { describe, expect, test } from "vitest"

import {
  buildInstanceDocument,
  diffInstances,
  type ExistingInstance,
  expandOccurrences,
  type GenerationParent,
  instanceIdFor,
  instanceSlugFor,
  occurrenceToken,
  publishedIdOf,
} from "./instances"

const parent: GenerationParent = {
  _id: "abc123",
  slug: "quiz-kvelden",
  approvalStatus: "approved",
}

const seed = { startDate: "2026-08-03", startTime: "19:00", endTime: "22:00" }

describe("expandOccurrences", () => {
  test("expands a weekly rule with COUNT and copies seed times", () => {
    // Arrange: 2026-08-03 is a Monday
    const rule = "FREQ=WEEKLY;BYDAY=MO;COUNT=4"

    // Act
    const occurrences = expandOccurrences(rule, seed)

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
    const biweekly = expandOccurrences(
      "FREQ=WEEKLY;INTERVAL=2;BYDAY=MO;COUNT=3",
      seed,
    )
    expect(biweekly.map(o => o.startDate)).toEqual([
      "2026-08-03",
      "2026-08-17",
      "2026-08-31",
    ])

    const monthly = expandOccurrences("FREQ=MONTHLY;COUNT=3", seed)
    expect(monthly.map(o => o.startDate)).toEqual([
      "2026-08-03",
      "2026-09-03",
      "2026-10-03",
    ])
  })

  test("caps an unbounded weekly rule at six months from the seed date", () => {
    const occurrences = expandOccurrences("FREQ=WEEKLY;BYDAY=MO", seed)

    expect(occurrences.length).toBeGreaterThan(20)
    const last = occurrences[occurrences.length - 1]
    // Six months after 2026-08-03 is 2027-02-03; 2027-02-01 is the last Monday.
    expect(last.startDate <= "2027-02-03").toBe(true)
    expect(last.startDate > "2027-01-20").toBe(true)
  })

  test("respects UNTIL when it is tighter than the cap", () => {
    const occurrences = expandOccurrences(
      "FREQ=WEEKLY;BYDAY=MO;UNTIL=20260824T000000Z",
      seed,
    )
    const last = occurrences[occurrences.length - 1]
    expect(last.startDate <= "2026-08-24").toBe(true)
    expect(occurrences.length).toBeLessThanOrEqual(4)
  })

  test("keeps the weekday across the October DST transition in Oslo", () => {
    // Oslo leaves CEST on 2026-10-25. Mondays before and after must stay Mondays.
    const occurrences = expandOccurrences("FREQ=WEEKLY;BYDAY=MO;COUNT=14", {
      startDate: "2026-10-05",
      startTime: "19:00",
      endTime: null,
    })

    for (const occurrence of occurrences) {
      const day = new Date(`${occurrence.startDate}T12:00:00Z`).getUTCDay()
      expect(day).toBe(1)
    }
    expect(occurrences.map(o => o.startDate)).toContain("2026-10-26")
  })

  test("keeps the weekday across the March DST transition in Oslo", () => {
    // Oslo enters CEST on 2027-03-28.
    const occurrences = expandOccurrences("FREQ=WEEKLY;BYDAY=MO;COUNT=6", {
      startDate: "2027-03-15",
      startTime: null,
      endTime: null,
    })

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
    expect(expandOccurrences("NOT-A-RULE", seed)).toEqual([])
    expect(
      expandOccurrences("FREQ=WEEKLY", { startDate: "not-a-date" }),
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
      "arrangement.abc123.2026-08-03-1300",
    )
    expect(instanceIdFor(parent._id, evening)).toBe(
      "arrangement.abc123.2026-08-03-1900",
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
      _id: "arrangement.abc123.2026-08-10-1900",
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
      [existingFor(occurrenceA, { approvalStatus: "paused" })],
    )
    expect(diff.orphanedEdited).toHaveLength(1)
  })
})
