import { describe, expect, it, vi } from "vitest"

vi.mock("./cached", () => ({}))

import type { EventStatistic, StatisticsReport } from "../domain/statistics"
import { eventStatsResult } from "./mcp"

const event = (overrides: Partial<EventStatistic>): EventStatistic => ({
  id: "e1",
  slug: "quiz",
  title: "Quiz",
  organizerName: "Kvarterets quizlag",
  organizerSlug: "quiz",
  imageUrl: null,
  series: null,
  instanceCount: 1,
  organizerGroup: null,
  eventType: null,
  firstDate: "2026-11-05",
  lastDate: "2026-11-05",
  isCancelled: false,
  isSoldOut: false,
  hasTicketLink: true,
  hasFacebookLink: false,
  isPromoted: false,
  firstSeen: null,
  daily: [],
  views: 10,
  sessions: 8,
  visitors: 7,
  ticketClicks: 2,
  facebookClicks: 0,
  medianSeconds: 30,
  ...overrides,
})

const report = (events: EventStatistic[]): StatisticsReport => ({
  period: 30,
  events,
  eventTotals: {
    views: 100,
    sessions: 80,
    visitors: 70,
    ticketClicks: 9,
    facebookClicks: 1,
    medianSeconds: 40,
  },
  eventDaily: [],
  groups: [
    {
      slug: "quiz",
      name: "Quizlaget",
      views: 5,
      sessions: 4,
      visitors: 3,
      daily: [],
    },
  ],
  groupTotals: { views: 5, sessions: 4, visitors: 3 },
  groupDaily: [],
})

const site = "https://www.samfunnetibergen.no"

describe("eventStatsResult", () => {
  it("sorts, limits and links the matching events", () => {
    const result = eventStatsResult(
      report([
        event({
          id: "a",
          slug: "a",
          title: "Quiz A",
          views: 5,
          ticketClicks: 9,
        }),
        event({ id: "b", slug: "b", title: "Quiz B", views: 50 }),
        event({ id: "c", slug: "c", title: "Konsert", organizerName: "Band" }),
      ]),
      { text: "quiz", sort: "ticketClicks", limit: 1 },
      site,
    )

    expect(result.matched).toBe(2)
    expect(result.matchedTotals).toEqual({
      views: 55,
      ticketClicks: 11,
      facebookClicks: 0,
    })
    expect(result.events).toHaveLength(1)
    expect(result.events[0]).toMatchObject({
      title: "Quiz A",
      websiteUrl: `${site}/arrangementer/a`,
      statsUrl: `${site}/arrangementer/statistikk/a?periode=30`,
    })
    // Group overview only for unfiltered questions.
    expect(result.groups).toBeUndefined()
  })

  it("filters on the organizer only", () => {
    const result = eventStatsResult(
      report([
        event({
          id: "a",
          slug: "a",
          title: "Band-quiz",
          organizerName: "Quizlaget",
        }),
        event({ id: "b", slug: "b", title: "Konsert", organizerName: "Band" }),
      ]),
      { organizer: "band" },
      site,
    )

    expect(result.events.map(row => row.slug)).toEqual(["b"])
  })

  it("adds the group overview without filters", () => {
    const result = eventStatsResult(report([event({})]), {}, site)
    expect(result.groups).toEqual([
      { name: "Quizlaget", slug: "quiz", views: 5, visitors: 3 },
    ])
  })
})
