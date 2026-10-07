import { describe, expect, it } from "vitest"

import {
  aggregateSeries,
  campaignDays,
  canSeeGroup,
  channelForDomain,
  clickRate,
  clickThroughRate,
  daysBetween,
  type EventStatistic,
  fillDailySeries,
  formatDateRange,
  formatDuration,
  isSafeIdentifier,
  leadTimeBuckets,
  liveDays,
  matchesSearch,
  matchesStatus,
  parseCampaignParam,
  parsePeriod,
  parseSortParam,
  parseStatusFilter,
  periodStart,
  reachByDay,
  serializeSortParam,
  toOsloDay,
  viewsPerLiveDay,
} from "./statistics"

describe("arrangement statistics domain", () => {
  it("accepts only the offered periods", () => {
    expect(parsePeriod("7")).toBe(7)
    expect(parsePeriod(["90", "7"])).toBe(90)
    expect(parsePeriod("365")).toBe(30)
    expect(parsePeriod(undefined)).toBe(30)
  })

  it("limits Gruppeadmin to assigned groups and lets Admin see all", () => {
    const groupAdmin = { groups: [{ slug: "quiz", name: "Quiz" }] }
    expect(canSeeGroup(groupAdmin, "quiz")).toBe(true)
    expect(canSeeGroup(groupAdmin, "kafe")).toBe(false)
    expect(canSeeGroup(groupAdmin, null)).toBe(false)
    expect(canSeeGroup({ groups: null }, null)).toBe(true)
  })

  it("fills missing days with zero, oldest first", () => {
    expect(
      fillDailySeries(
        [{ day: "2026-10-05", views: "4", visitors: 3 }],
        3,
        "2026-10-06",
      ),
    ).toEqual([
      { day: "2026-10-04", views: 0, visitors: 0 },
      { day: "2026-10-05", views: 4, visitors: 3 },
      { day: "2026-10-06", views: 0, visitors: 0 },
    ])
  })

  it("keeps quotes and HogQL syntax out of identifiers", () => {
    expect(isSafeIdentifier("a1b2-c3_d.e")).toBe(true)
    expect(isSafeIdentifier("x') OR 1=1 --")).toBe(false)
    expect(isSafeIdentifier(42)).toBe(false)
  })

  it("formats durations in Norwegian", () => {
    expect(formatDuration(null)).toBe("–")
    expect(formatDuration(42)).toBe("42 s")
    expect(formatDuration(150)).toBe("2 min 30 s")
    expect(formatDuration(120)).toBe("2 min")
  })
})

describe("arrangement statistics table", () => {
  const event = (overrides: Partial<EventStatistic>): EventStatistic => ({
    id: "id",
    slug: "slug",
    title: "Arrangement",
    organizerName: null,
    organizerSlug: null,
    imageUrl: null,
    series: null,
    instanceCount: 1,
    hasTicketLink: true,
    hasFacebookLink: true,
    isPromoted: false,
    firstSeen: null,
    daily: [],
    organizerGroup: null,
    eventType: null,
    firstDate: "2026-10-01",
    lastDate: "2026-10-01",
    isCancelled: false,
    isSoldOut: false,
    views: 0,
    sessions: 0,
    visitors: 0,
    ticketClicks: 0,
    facebookClicks: 0,
    medianSeconds: null,
    ...overrides,
  })
  const today = "2026-10-06"

  it("classifies upcoming, expired, cancelled and sold-out events", () => {
    const past = event({ lastDate: "2026-10-05" })
    const ongoingSeries = event({ firstDate: "2026-09-01", lastDate: today })
    const cancelled = event({ isCancelled: true, lastDate: "2026-12-01" })
    const soldOut = event({ isSoldOut: true, lastDate: "2026-12-01" })

    expect(matchesStatus(past, "utlopt", today)).toBe(true)
    expect(matchesStatus(past, "kommende", today)).toBe(false)
    expect(matchesStatus(ongoingSeries, "kommende", today)).toBe(true)
    expect(matchesStatus(cancelled, "avlyst", today)).toBe(true)
    expect(matchesStatus(cancelled, "kommende", today)).toBe(false)
    expect(matchesStatus(soldOut, "utsolgt", today)).toBe(true)
    expect(matchesStatus(soldOut, "kommende", today)).toBe(true)
  })

  it("falls back to safe defaults for unknown URL values", () => {
    expect(parseStatusFilter("slettet")).toBe("alle")
    expect(parseSortParam(null)).toEqual({ id: "visninger", desc: true })
    expect(parseSortParam("drop table")).toEqual({
      id: "visninger",
      desc: true,
    })
  })

  it("round-trips sort state through the URL", () => {
    expect(parseSortParam("billettklikk")).toEqual({
      id: "billettklikk",
      desc: true,
    })
    expect(parseSortParam("-dato")).toEqual({ id: "dato", desc: false })
    expect(serializeSortParam({ id: "visninger", desc: true })).toBeNull()
    expect(serializeSortParam({ id: "dato", desc: false })).toBe("-dato")
  })

  it("folds series dates and the parent page into one row", () => {
    const series = { id: "parent", slug: "quiz", title: "Quiz" }
    const rows = aggregateSeries([
      event({
        id: "parent",
        series,
        views: 5,
        firstDate: null,
        lastDate: null,
      }),
      event({
        id: "a",
        series,
        views: 10,
        ticketClicks: 2,
        firstDate: "2026-09-01",
        lastDate: "2026-09-01",
        medianSeconds: 10,
      }),
      event({
        id: "b",
        series,
        views: 20,
        ticketClicks: 1,
        firstDate: "2026-10-01",
        lastDate: "2026-10-01",
        medianSeconds: 30,
        isSoldOut: true,
      }),
      event({ id: "single", views: 7 }),
    ])
    const quiz = rows.find(row => row.id === "parent")
    expect(rows).toHaveLength(2)
    expect(quiz).toMatchObject({
      slug: "quiz",
      title: "Quiz",
      instanceCount: 2,
      views: 35,
      ticketClicks: 3,
      firstDate: "2026-09-01",
      lastDate: "2026-10-01",
      isSoldOut: true,
      isCancelled: false,
      medianSeconds: 20,
    })
    expect(rows.find(row => row.id === "single")?.views).toBe(7)
  })

  it("searches title, series and organizer, ignoring case and accents", () => {
    const quiz = event({
      title: "Høstfinalen",
      organizerName: "Quizgruppen",
      series: { id: "s", slug: "s", title: "Tirsdagsquiz" },
    })
    expect(matchesSearch(quiz, "")).toBe(true)
    expect(matchesSearch(quiz, "hostfinalen")).toBe(true)
    expect(matchesSearch(quiz, "tirsdag quizgruppen")).toBe(true)
    expect(matchesSearch(quiz, "konsert")).toBe(false)
  })
})

describe("event detail helpers", () => {
  it("groups referring domains into channels", () => {
    expect(channelForDomain("$direct")).toBe("Direkte")
    expect(channelForDomain(null)).toBe("Direkte")
    expect(channelForDomain("www.google.no")).toBe("Søkemotorer")
    expect(channelForDomain("search.brave.com")).toBe("Søkemotorer")
    expect(channelForDomain("l.instagram.com")).toBe("Sosiale medier")
    expect(channelForDomain("m.facebook.com")).toBe("Sosiale medier")
    expect(channelForDomain("www.samfunnetibergen.no")).toBe(
      "samfunnetibergen.no",
    )
    expect(channelForDomain("www.studybergen.com")).toBe("Andre nettsider")
    expect(channelForDomain("www.kvarteret.no")).toBe("Andre nettsider")
  })

  it("formats click rates and date ranges", () => {
    expect(clickRate(5, 0)).toBe("–")
    expect(clickRate(1, 3)).toBe("33 %")
    expect(formatDateRange("2026-10-14", "2026-10-22")).toBe(
      "14. okt. – 22. okt.",
    )
    expect(formatDateRange("2026-10-14", "2026-10-14")).toBe("14. okt.")
  })
})

describe("reach and timing", () => {
  const today = "2026-10-07"
  const start = periodStart(today, 30)

  it("starts the period on the right Oslo date", () => {
    expect(start).toBe("2026-09-08")
    expect(periodStart(today, 7)).toBe("2026-10-01")
  })

  it("counts live days from first view until the event or today", () => {
    expect(
      liveDays(
        { firstSeen: "2026-10-05", lastDate: "2026-12-01" },
        start,
        today,
      ),
    ).toBe(3)
    expect(
      liveDays(
        { firstSeen: "2026-09-01", lastDate: "2026-09-20" },
        start,
        today,
      ),
    ).toBe(13)
    expect(liveDays({ firstSeen: null, lastDate: null }, start, today)).toBe(30)
    expect(
      liveDays(
        { firstSeen: "2026-10-07", lastDate: "2026-10-07" },
        start,
        today,
      ),
    ).toBe(1)
  })

  it("normalises views by live days so new events compare fairly", () => {
    const fresh = { firstSeen: "2026-10-05", lastDate: "2026-12-01", views: 30 }
    const old = { firstSeen: "2026-08-01", lastDate: "2026-12-01", views: 150 }
    expect(viewsPerLiveDay(fresh, start, today)).toBe(10)
    expect(viewsPerLiveDay(old, start, today)).toBe(5)
  })

  it("buckets views by days before the event", () => {
    const buckets = leadTimeBuckets([
      { day: "2026-09-01", eventDate: "2026-10-10", views: 4 },
      { day: "2026-10-09", eventDate: "2026-10-10", views: 3 },
      { day: "2026-10-10", eventDate: "2026-10-10", views: 2 },
      { day: "2026-10-12", eventDate: "2026-10-10", views: 1 },
    ])
    expect(
      Object.fromEntries(buckets.map(b => [b.name, b.value])),
    ).toMatchObject({
      "30+ dager før": 4,
      "Dagen før": 3,
      "Samme dag": 2,
      Etterpå: 1,
      "4–7 dager før": 0,
    })
  })

  it("marks buckets the event has not reached yet as pending", () => {
    const buckets = leadTimeBuckets([], ["2026-10-08"], "2026-10-07")
    const pending = buckets.filter(b => b.pending).map(b => b.name)
    expect(pending).toEqual(["Samme dag", "Etterpå"])
    expect(
      leadTimeBuckets([], ["2026-10-01"], "2026-10-07").some(b => b.pending),
    ).toBe(false)
  })

  it("formats click-through rates", () => {
    expect(clickThroughRate(3, 0)).toBe("–")
    expect(clickThroughRate(8, 132)).toBe("6 %")
  })
})

describe("fremhevingskampanjer", () => {
  it("uses Oslo dates for campaign timestamps", () => {
    expect(toOsloDay("2026-09-28T17:20:19Z")).toBe("2026-09-28")
    expect(toOsloDay("2026-09-28T22:30:00Z")).toBe("2026-09-29")
  })

  it("covers every day of each campaign, running ones until today", () => {
    const days = campaignDays(
      [
        { from: "2026-09-28T17:20:19Z", until: "2026-09-30T08:00:00Z" },
        { from: "2026-10-06T10:00:00Z", until: null },
      ],
      "2026-10-07",
    )
    expect([...days]).toEqual([
      "2026-09-28",
      "2026-09-29",
      "2026-09-30",
      "2026-10-06",
      "2026-10-07",
    ])
  })
})

describe("reach decay", () => {
  const days = ["2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08"]

  it("keeps campaign days since tracking, filling missing days with zero", () => {
    expect(
      reachByDay(
        [{ day: "2026-10-06", people: "40", first_time: 40 }],
        days,
        new Set(["2026-10-05", "2026-10-06", "2026-10-07"]),
      ),
    ).toEqual([
      { day: "2026-10-06", people: 40, firstTime: 40 },
      { day: "2026-10-07", people: 0, firstTime: 0 },
    ])
  })

  it("includes days with impressions outside known campaigns", () => {
    expect(
      reachByDay(
        [{ day: "2026-10-08", people: 5, first_time: 2 }],
        days,
        new Set(),
      ),
    ).toEqual([{ day: "2026-10-08", people: 5, firstTime: 2 }])
  })
})

describe("campaign selection", () => {
  it("reads a 1-based campaign number within range", () => {
    expect(parseCampaignParam("2", 3)).toBe(1)
    expect(parseCampaignParam(["1"], 3)).toBe(0)
    for (const value of ["0", "4", "1.5", "x", undefined]) {
      expect(parseCampaignParam(value, 3)).toBeNull()
    }
  })

  it("lists the days of a campaign inclusively", () => {
    expect(daysBetween("2026-09-30", "2026-10-02")).toEqual([
      "2026-09-30",
      "2026-10-01",
      "2026-10-02",
    ])
  })
})
