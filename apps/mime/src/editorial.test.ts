import { describe, expect, test } from "vitest"
import {
  detachEvents,
  houseHoursPlan,
  type Loaded,
  mergeDates,
  mergeIntoParent,
  mergeIntoSingle,
  slugify,
} from "./editorial"

const title = (value: string) => [
  {
    _key: "nb",
    _type: "internationalizedArrayStringValue",
    language: "nb",
    value,
  },
]

const loaded = (
  id: string,
  doc: Record<string, unknown> = {},
  extra: Partial<Loaded> = {},
): Loaded => ({
  id,
  doc: {
    _id: id,
    _type: "arrangement",
    eventKind: "single",
    approvalStatus: "approved",
    localizedTitle: title("Don Juan"),
    dates: [{ _key: `${id}-d`, startDate: "2026-11-14", startTime: "18:40" }],
    ...doc,
  },
  published: true,
  hasDraft: false,
  referencedBy: 0,
  ...extra,
})

const tools = (plan: { ops: { tool: string }[] }) => plan.ops.map(op => op.tool)

describe("mergeDates", () => {
  test("sorts, keeps keys and drops repeated slots", () => {
    const dates = mergeDates([
      [{ _key: "b", startDate: "2026-11-16", startTime: "18:40" }],
      [
        { _key: "a", startDate: "2026-11-14", startTime: "18:40" },
        { _key: "c", startDate: "2026-11-16", startTime: "18:40" },
      ],
    ])
    expect(dates.map(date => date._key)).toEqual(["a", "b"])
    expect(dates[0]._type).toBe("arrangementDate")
  })
})

describe("merge into one event", () => {
  const events = [
    loaded("keep", { ticketUrl: "https://t.no/main" }),
    loaded("dup1", {
      dates: [{ _key: "x", startDate: "2026-11-17", startTime: "19:00" }],
      ticketUrl: "https://t.no/tue",
    }),
    loaded(
      "dup2",
      {
        dates: [{ _key: "y", startDate: "2026-11-19", startTime: "19:00" }],
        ticketUrl: "https://t.no/thu",
      },
      { published: false },
    ),
  ]

  test("patches and publishes the kept event, then removes the others", () => {
    const plan = mergeIntoSingle(events, "keep")
    expect(tools(plan)).toEqual([
      "patch_documents",
      "publish_documents",
      "unpublish_documents",
      "discard_drafts",
    ])
    const set = (
      plan.ops[0].input.documents as Record<
        string,
        { patches: { set?: Record<string, unknown> }[] }
      >
    ).keep.patches[0].set as Record<string, unknown>
    expect(
      (set.dates as { startDate: string }[]).map(d => d.startDate),
    ).toEqual(["2026-11-14", "2026-11-17", "2026-11-19"])
    expect(set.sourceTicketUrls).toEqual([
      "https://t.no/tue",
      "https://t.no/thu",
    ])
    // Only the published duplicate needs unpublishing; both drafts go.
    expect(plan.ops[2].input.ids).toEqual(["dup1"])
    expect(plan.ops[3].input.ids).toEqual(["dup1", "dup2"])
    expect(plan.ops.every(op => op.label)).toBe(true)
  })

  test("refuses to remove an event that something else references", () => {
    const blocked = [events[0], { ...events[1], referencedBy: 2 }]
    expect(() => mergeIntoSingle(blocked, "keep")).toThrow(/peker på/)
  })

  test("warns when the kept event has an unpublished draft", () => {
    const plan = mergeIntoSingle(
      [{ ...events[0], hasDraft: true }, events[1]],
      "keep",
    )
    expect(plan.warnings[0]).toContain("upublisert utkast")
  })
})

describe("merge into a series or festival", () => {
  const events = [
    loaded("a", { room: { _ref: "room-tivoli" } }),
    loaded("b", {
      dates: [
        { _key: "b1", startDate: "2026-11-16", startTime: "18:40" },
        { _key: "b2", startDate: "2026-11-17", startTime: "19:00" },
      ],
      localizedTitle: title("Don Juan (tirsdag)"),
    }),
  ]

  test("creates and publishes the parent before the children reference it", () => {
    const plan = mergeIntoParent(events, "series", { suffix: "abc123" })
    expect(tools(plan)).toEqual([
      "create_documents",
      "publish_documents",
      "patch_documents",
      "create_documents",
      "publish_documents",
    ])
    const parent = (
      plan.ops[0].input.documents as { content: Record<string, unknown> }[]
    )[0].content
    expect(parent).toMatchObject({
      _id: "arrangement-series-don-juan-abc123",
      eventKind: "seriesParent",
      room: { _ref: "room-tivoli" },
      slug: { current: "don-juan-abc123" },
    })
    expect(parent.dates).toHaveLength(1)
    expect(plan.ops[1].input.ids).toEqual([
      { id: "arrangement-series-don-juan-abc123" },
    ])
    const patches = plan.ops[2].input.documents as Record<
      string,
      { patches: unknown[] }
    >
    // Same title as the series: inherit it. Different title: keep it.
    expect(JSON.stringify(patches.a.patches)).toContain(
      '"unset":["localizedTitle"]',
    )
    expect(JSON.stringify(patches.b.patches)).not.toContain("unset")
    // b's second date becomes its own series day.
    const extra = (
      plan.ops[3].input.documents as { content: Record<string, unknown> }[]
    )[0].content
    expect(extra).toMatchObject({
      _id: "arrangement-series-don-juan-abc123-2026-11-17-1900",
      eventKind: "seriesInstance",
      parentEvent: { _ref: "arrangement-series-don-juan-abc123" },
    })
    expect(plan.ops[4].input.ids).toHaveLength(3)
  })

  test("a festival parent has no dates", () => {
    const plan = mergeIntoParent(events, "festival", { titleNb: "Teaterdager" })
    const parent = (
      plan.ops[0].input.documents as { content: Record<string, unknown> }[]
    )[0].content
    expect(parent.eventKind).toBe("festivalParent")
    expect(parent.dates).toBeUndefined()
    expect(plan.summary).toContain("beskrivelse")
  })

  test("reuses an existing parent among the ids", () => {
    const parent = loaded("p", {
      eventKind: "festivalParent",
      slug: { current: "fest" },
    })
    const plan = mergeIntoParent([parent, events[0]], "festival")
    expect(tools(plan)).toEqual(["patch_documents", "publish_documents"])
  })
})

describe("detach", () => {
  test("fills in inherited fields and drops the parent", () => {
    const parent = loaded("p", {
      eventKind: "seriesParent",
      room: { _ref: "room-tivoli" },
    })
    const child = loaded("c", {
      eventKind: "seriesInstance",
      parentEvent: { _ref: "p" },
      localizedTitle: undefined,
    })
    const plan = detachEvents([child], [parent])
    const patches = (
      plan.ops[0].input.documents as Record<
        string,
        { patches: Record<string, unknown>[] }
      >
    ).c.patches
    expect(patches[0].set).toMatchObject({
      eventKind: "single",
      room: { _ref: "room-tivoli" },
      localizedTitle: title("Don Juan"),
    })
    expect(patches[1]).toEqual({ unset: ["parentEvent"] })
  })
})

describe("house hours", () => {
  const site = {
    _id: "siteMetadata",
    houseClosedDates: [{ _key: "k1", date: "2026-12-24", note: "Julaften" }],
  }

  test("adds a closed day and publishes", () => {
    const plan = houseHoursPlan(site, {
      close: [{ date: "2026-11-06", note: "Stengt for vedlikehold" }],
    })
    expect(tools(plan)).toEqual(["patch_documents", "publish_documents"])
    expect(JSON.stringify(plan.ops[0].input)).toContain('"date":"2026-11-06"')
    expect(plan.summary).toContain("2026-11-06")
  })

  test("removes a closed day by key and skips days already closed", () => {
    const plan = houseHoursPlan(site, {
      close: [{ date: "2026-12-24" }],
      reopen: ["2026-12-24"],
    })
    expect(JSON.stringify(plan.ops[0].input)).toContain(
      'houseClosedDates[_key==\\"k1\\"]',
    )
    expect(JSON.stringify(plan.ops[0].input)).not.toContain("insert")
  })

  test("nothing to do is an error", () => {
    expect(() => houseHoursPlan(site, { reopen: ["2026-01-01"] })).toThrow()
  })
})

test("slugify handles Norwegian letters", () => {
  expect(slugify("Lillelørdag: Gruppekavalkade på Kvarteret!")).toBe(
    "lillelordag-gruppekavalkade-pa-kvarteret",
  )
})
