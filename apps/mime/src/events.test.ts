import { describe, expect, test, vi } from "vitest"
import {
  dateRange,
  eventRef,
  eventTools,
  occurrences,
  onWebsite,
  searchTerms,
} from "./events"

const scope = {
  projectId: "p1",
  dataset: "production",
  token: "t",
  studioUrl: "https://studio.example.no",
}

const event = (overrides: Record<string, unknown> = {}) => ({
  id: "e1",
  draftOnly: false,
  hasDraft: false,
  kind: "seriesInstance",
  approvalStatus: "approved",
  eventStatus: "scheduled",
  title: "Onsdagsimpro",
  parent: { id: "p", title: "Onsdagsimpro" },
  room: "Speilsalen",
  organizer: "Immaturus",
  internal: false,
  infoScreenOnly: false,
  ticketUrl: null,
  slug: "onsdagsimpro-2026-11-04",
  submittedBy: null,
  dates: [{ startDate: "2026-11-04", startTime: "15:30", endTime: "17:30" }],
  ...overrides,
})

describe("dates and terms", () => {
  test("defaults to today, one day", () => {
    expect(dateRange("2026-11-04")).toEqual({
      from: "2026-11-04",
      to: "2026-11-04",
    })
  })
  test("rejects bad and reversed ranges", () => {
    expect(() => dateRange("2026-11-04", "4. nov")).toThrow()
    expect(() => dateRange("2026-11-04", "2026-11-05", "2026-11-01")).toThrow()
    expect(() => dateRange("2026-11-04", "2026-01-01", "2026-12-31")).toThrow()
  })
  test("title words become prefix terms", () => {
    expect(searchTerms("Impro i Speilsalen!")).toEqual([
      "impro*",
      "speilsalen*",
    ])
    expect(searchTerms("  ")).toBeNull()
  })
  test("refs: ids, drafts, slugs, website and Studio URLs", () => {
    expect(eventRef("drafts.abc")).toEqual({ id: "abc", slug: "abc" })
    expect(
      eventRef("https://www.samfunnetibergen.no/nb/arrangementer/don-juan-1"),
    ).toEqual({ id: null, slug: "don-juan-1" })
    expect(
      eventRef(
        "https://studio.example.no/intent/edit/id=drafts.x1;type=arrangement/",
      ),
    ).toEqual({ id: "x1", slug: null })
  })
})

describe("website visibility", () => {
  test("only approved, public, published concrete events", () => {
    expect(onWebsite(event())).toBe(true)
    expect(onWebsite(event({ approvalStatus: "pending" }))).toBe(false)
    expect(onWebsite(event({ internal: true }))).toBe(false)
    expect(onWebsite(event({ infoScreenOnly: true }))).toBe(false)
    expect(onWebsite(event({ draftOnly: true }))).toBe(false)
    expect(onWebsite(event({ kind: "seriesParent" }))).toBe(false)
  })
  test("one sorted row per date, with links", () => {
    const rows = occurrences(
      [
        event({
          id: "late",
          title: "Quiz",
          dates: [{ startDate: "2026-11-04", startTime: "20:00" }],
        }),
        event({ approvalStatus: "pending", slug: null }),
      ] as never,
      scope,
    )
    expect(rows.map(row => [row.start, row.title, row.onWebsite])).toEqual([
      ["15:30", "Onsdagsimpro", false],
      ["20:00", "Quiz", true],
    ])
    expect(rows[1].websiteUrl).toBe(
      "https://www.samfunnetibergen.no/nb/arrangementer/onsdagsimpro-2026-11-04",
    )
    expect(rows[0].websiteUrl).toBeUndefined()
    expect(rows[0].studioUrl).toBe(
      "https://studio.example.no/intent/edit/id=e1;type=arrangement/",
    )
  })
})

describe("find_events", () => {
  test("queries the raw perspective with fixed params", async () => {
    const fetchFn = vi.fn(async () =>
      Response.json({ result: [event(), event({ id: "e2", internal: true })] }),
    )
    const tools = eventTools(scope, () => "2026-11-04", fetchFn as never)
    const result = (await tools.find_events.execute?.(
      { text: "impro" },
      {} as never,
    )) as { count: number; onWebsite: number }
    expect(result).toMatchObject({ count: 2, onWebsite: 1 })
    const [url, init] = fetchFn.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ]
    expect(url).toContain("p1.api.sanity.io")
    expect(url).toContain("perspective=raw")
    const body = JSON.parse(init.body as string)
    expect(body.params).toMatchObject({
      from: "2026-11-04",
      to: "2026-11-04",
      terms: ["impro*"],
      statuses: ["approved", "pending"],
    })
    expect(body.query).toContain("dates[startDate >= $from")
  })
  test("reports errors instead of throwing", async () => {
    const fetchFn = vi.fn(async () => new Response("no", { status: 401 }))
    const tools = eventTools(scope, () => "2026-11-04", fetchFn as never)
    expect(await tools.find_events.execute?.({}, {} as never)).toMatchObject({
      error: expect.stringContaining("401"),
    })
  })
})
