import type { SanityClient } from "@sanity/client"
import { afterEach, describe, expect, test, vi } from "vitest"
import { accessToken, openToken, sealToken, TOKEN_ID } from "./auth"
import { Canva, PLACEHOLDER_IMAGE, pageData, requiredDataset } from "./canva"
import { applyCopy } from "./copy"
import {
  planPages,
  readWeek,
  scheduleDue,
  type WeeklyEvent,
  weekFor,
} from "./plan"
import { type Dependencies, notifyWeek, runWeekly } from "./runner"

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})
const event = (id = "one", date = "2026-10-17"): WeeklyEvent => ({
  id,
  date,
  title: "Konsert",
  description: "En konsert med et band.",
  locationTime: "Teglverket – 20:00",
  imageUrl: null,
  url: "https://samfunnetibergen.no/arrangementer/konsert",
})
const design = {
  id: "Dnew",
  urls: { edit_url: "https://www.canva.com/design/Dnew/edit" },
}

function fixture() {
  const docs = new Map<string, Record<string, unknown>>()
  let revision = 0
  const client = {
    getDocument: vi.fn(async (id: string) =>
      docs.get(id) ? structuredClone(docs.get(id)) : undefined,
    ),
    createIfNotExists: vi.fn(async (doc: { _id: string }) => {
      if (!docs.has(doc._id))
        docs.set(doc._id, { ...doc, _rev: String(++revision) })
      return structuredClone(docs.get(doc._id))
    }),
    patch: vi.fn((id: string) => {
      let expected: string
      let values: Record<string, unknown> = {}
      let unset: string[] = []
      const patch = {
        ifRevisionId: (rev: string) => {
          expected = rev
          return patch
        },
        set: (next: Record<string, unknown>) => {
          values = { ...values, ...structuredClone(next) }
          return patch
        },
        unset: (keys: string[]) => {
          unset = keys
          return patch
        },
        commit: async () => {
          const doc = docs.get(id)
          if (doc?._rev !== expected)
            throw Object.assign(new Error("Conflict"), { statusCode: 409 })
          const next: Record<string, unknown> = {
            ...doc,
            ...values,
            _rev: String(++revision),
          }
          for (const key of unset) delete next[key]
          docs.set(id, next)
          return structuredClone(next)
        },
      }
      return patch
    }),
  } as unknown as SanityClient
  const canva = {
    dataset: vi.fn(async () => {}),
    uploadImage: vi.fn(async () => "Mimage"),
    autofill: vi.fn(async () => "autofill-job"),
    merge: vi.fn(async () => "merge-job"),
    poll: vi.fn(async () => ({
      id: "job",
      status: "success",
      result: { design },
    })),
  }
  const deps: Dependencies = {
    read: vi.fn(async () => [event()]),
    copy: vi.fn(async events => events),
    canva: vi.fn(async () => canva as unknown as Canva),
    notify: vi.fn(async () => {}),
  }
  vi.stubEnv(
    "SLACK_NETTSIDE_WEBHOOK",
    "https://hooks.slack.com/services/test/test/test",
  )
  return { client, docs, deps, canva }
}

describe("Oslo weekly scheduling", () => {
  test.each([
    ["2026-07-05T05:59:00Z", false],
    ["2026-07-05T06:00:00Z", true],
    ["2026-01-04T06:59:00Z", false],
    ["2026-01-04T07:00:00Z", true],
    ["2026-03-29T06:00:00Z", true],
    ["2026-10-25T06:00:00Z", false],
    ["2026-10-25T07:00:00Z", true],
    ["2026-10-26T07:00:00Z", false],
  ])("checks %s against local 08:00", (date, due) =>
    expect(scheduleDue(new Date(date))).toBe(due),
  )
  test("selects next Monday and handles ISO year rollover", () => {
    expect(weekFor(new Date("2026-10-11T16:00:00Z"))).toEqual({
      from: "2026-10-12",
      to: "2026-10-18",
      number: 42,
      year: 2026,
    })
    expect(weekFor(new Date("2027-01-03T17:00:00Z"))).toEqual({
      from: "2027-01-04",
      to: "2027-01-10",
      number: 1,
      year: 2027,
    })
    expect(() => weekFor(new Date(), "2026-10-11")).toThrow("Monday")
    expect(() => weekFor(new Date(), "2026-02-30")).toThrow("Invalid")
  })
  test("keeps all weekend and overflow events", () => {
    const pages = planPages([
      event("a"),
      event("b"),
      event("c"),
      event("d", "2026-10-18"),
    ])
    expect(pages.map(p => p.heading)).toEqual(["LØRDAG", "LØRDAG", "SØNDAG"])
    expect(pages.flatMap(p => p.events).map(e => e.id)).toEqual([
      "a",
      "b",
      "c",
      "d",
    ])
  })
})

function apiOccurrence(id = "one", cancelled = false) {
  return {
    id,
    schedule: {
      kind: "timed",
      startsAt: "2026-10-17T18:00:00Z",
      endsAt: null,
      doorsOpenAt: null,
      timeZone: "Europe/Oslo",
    },
    event: {
      id,
      slug: id,
      kind: "single",
      status: cancelled ? "cancelled" : "scheduled",
      updatedAt: null,
      title: "API title",
      description: { text: "API description", html: "<p>API description</p>" },
      image: null,
      eventType: null,
      taxonomyGroup: null,
      organizer: null,
      parent: null,
      location: {
        kind: "room",
        id: "room",
        name: "Teglverket",
        slug: "teglverket",
        floor: 1,
        imageUrl: null,
      },
      pricing: {
        currency: "NOK",
        isFree: true,
        ordinary: null,
        student: null,
        member: null,
      },
      links: {
        website: `https://www.samfunnetibergen.no/nb/arrangementer/${id}`,
        ticket: null,
        facebook: null,
      },
    },
  }
}
function apiResponse(data: unknown[], from = "2026-10-12") {
  return Response.json({ data, meta: { locale: "nb", from, to: "2026-10-18" } })
}

test("reads the public events API and converts timestamps to Oslo time", async () => {
  const request = vi.fn(
    async (_url: string | URL | Request, _options?: RequestInit) =>
      apiResponse([apiOccurrence(), apiOccurrence("cancelled", true)]),
  )
  const events = await readWeek(weekFor(new Date(), "2026-10-12"), request)
  expect(events).toHaveLength(1)
  expect(events[0]).toMatchObject({
    title: "API title",
    description: "API description",
    locationTime: "Teglverket – 20:00",
    url: "https://www.samfunnetibergen.no/nb/arrangementer/one",
  })
  expect(String(request.mock.calls[0]?.[0])).toBe(
    "https://www.samfunnetibergen.no/api/v1/events?locale=nb&from=2026-10-12&to=2026-10-18",
  )
})

test("API date-only events show missing time explicitly", async () => {
  const item = {
    ...apiOccurrence(),
    schedule: { kind: "date", date: "2026-10-17", timeZone: "Europe/Oslo" },
  }
  const result = await readWeek(
    weekFor(new Date(), "2026-10-12"),
    vi.fn(async () => apiResponse([item])),
  )
  expect(result[0].locationTime).toBe("Teglverket – Tid ikke oppgitt")
})

test("API errors, wrong range, duplicate ids and malformed responses fail closed", async () => {
  const week = weekFor(new Date(), "2026-10-12")
  await expect(
    readWeek(
      week,
      vi.fn(async () => new Response("unavailable", { status: 503 })),
    ),
  ).rejects.toThrow("HTTP 503")
  await expect(
    readWeek(
      week,
      vi.fn(async () => apiResponse([], "2026-10-05")),
    ),
  ).rejects.toThrow("wrong week")
  await expect(
    readWeek(
      week,
      vi.fn(async () => apiResponse([apiOccurrence(), apiOccurrence()])),
    ),
  ).rejects.toThrow("duplicate")
  await expect(
    readWeek(
      week,
      vi.fn(async () => Response.json({ data: [] })),
    ),
  ).rejects.toThrow()
})

test("Luna cannot drop events, invent ids, duplicate events, or exceed template limits", () => {
  const events = [event("one"), event("two")]
  const copy = {
    events: events.map(e => ({
      id: e.id,
      title: "Kort tittel",
      description: "Kort tekst.",
    })),
  }
  expect(applyCopy(events, copy)[0].locationTime).toBe(events[0].locationTime)
  expect(() => applyCopy(events, { events: copy.events.slice(0, 1) })).toThrow()
  expect(() =>
    applyCopy(events, { events: [copy.events[0], copy.events[0]] }),
  ).toThrow()
  expect(() =>
    applyCopy(events, {
      events: [copy.events[0], { ...copy.events[1], id: "invented" }],
    }),
  ).toThrow()
  expect(() =>
    applyCopy(events, {
      events: [
        { ...copy.events[0], description: "x".repeat(96) },
        copy.events[1],
      ],
    }),
  ).toThrow()
  expect(() =>
    applyCopy(events, {
      events: [
        { ...copy.events[0], description: "https://evil.test" },
        copy.events[1],
      ],
    }),
  ).toThrow()
})

test("encrypts tokens and rejects tampering and wrong keys", () => {
  const key = "ab".repeat(32)
  const token = {
    accessToken: "secret-access",
    refreshToken: "secret-refresh",
    expiresAt: 10000,
  }
  const sealed = sealToken(token, key)
  expect(sealed).not.toContain("secret")
  expect(openToken(sealed, key)).toEqual(token)
  expect(() => openToken(sealed, "cd".repeat(32))).toThrow()
  const corrupt = Buffer.from(sealed, "base64")
  corrupt[30] ^= 1
  expect(() => openToken(corrupt.toString("base64"), key)).toThrow()
})

test("autofill always clears unused event slots and replaces historical images", () => {
  const data = pageData(
    weekFor(new Date(), "2026-10-12"),
    { heading: "LØRDAG", events: [event()] },
    {},
    [],
  )
  expect(Object.keys(data).sort()).toEqual(
    Object.keys(requiredDataset()).sort(),
  )
  expect(data.event_2_title).toEqual({ type: "text", text: "" })
  expect(data.event_2_image).toEqual({
    type: "image",
    asset_id: PLACEHOLDER_IMAGE,
  })
})

test("refuses missing Canva fields instead of silently keeping old content", async () => {
  const request = vi.fn(async () => Response.json({ dataset: {} }))
  await expect(
    new Canva("token", request).dataset("Dtemplate"),
  ).rejects.toThrow("missing")
})

test("dry run writes no state, rotates no tokens and sends no Slack", async () => {
  const { client, deps } = fixture()
  expect((await runWeekly(client, { dryRun: true }, deps)).status).toBe(
    "dry-run",
  )
  expect(client.createIfNotExists).not.toHaveBeenCalled()
  expect(deps.canva).not.toHaveBeenCalled()
  expect(deps.notify).not.toHaveBeenCalled()
})

test("generation resumes after Slack failure without creating more designs", async () => {
  const { client, deps, canva } = fixture()
  vi.mocked(deps.notify).mockRejectedValueOnce(new Error("Slack failed"))
  const options = { monday: "2026-10-12" }
  await expect(runWeekly(client, options, deps)).rejects.toThrow("Slack failed")
  expect(canva.autofill).toHaveBeenCalledTimes(3)
  expect(canva.merge).toHaveBeenCalledTimes(3)
  expect((await runWeekly(client, options, deps)).status).toBe("complete")
  expect(canva.autofill).toHaveBeenCalledTimes(3)
  expect((await runWeekly(client, options, deps)).status).toBe(
    "already-delivered",
  )
  expect(deps.notify).toHaveBeenCalledTimes(2)
})

test("resumes a saved autofill job after a polling failure", async () => {
  const { client, deps, canva } = fixture()
  canva.poll.mockRejectedValueOnce(new Error("Timeout"))
  await expect(
    runWeekly(client, { monday: "2026-10-12" }, deps),
  ).rejects.toThrow("Timeout")
  expect(canva.autofill).toHaveBeenCalledTimes(1)
  await runWeekly(client, { monday: "2026-10-12" }, deps)
  expect(canva.autofill).toHaveBeenCalledTimes(3)
})

test("empty weeks notify once and create no designs", async () => {
  const { client, deps } = fixture()
  vi.mocked(deps.read).mockResolvedValue([])
  expect((await runWeekly(client, { monday: "2026-10-12" }, deps)).status).toBe(
    "empty",
  )
  await runWeekly(client, { monday: "2026-10-12" }, deps)
  expect(deps.canva).not.toHaveBeenCalled()
  expect(deps.notify).toHaveBeenCalledTimes(1)
})

test("persists a rotated single-use token before returning access", async () => {
  const { client, docs } = fixture()
  const key = "ab".repeat(32)
  vi.stubEnv("CANVA_TOKEN_ENCRYPTION_KEY", key)
  vi.stubEnv("CANVA_CLIENT_ID", "client")
  vi.stubEnv("CANVA_CLIENT_SECRET", "client-secret")
  await client.createIfNotExists({
    _id: TOKEN_ID,
    _type: "weeklyCanvaOAuth",
    encryptedToken: sealToken(
      { accessToken: "old", refreshToken: "old-refresh", expiresAt: 0 },
      key,
    ),
  })
  const request = vi.fn(async () => {
    expect(docs.get(TOKEN_ID)?.refreshStartedAt).toBeTruthy()
    return Response.json({
      access_token: "new-access",
      refresh_token: "new-refresh",
      expires_in: 3600,
    })
  })
  vi.stubGlobal("fetch", request)
  expect(await accessToken(client)).toBe("new-access")
  expect(
    openToken(docs.get(TOKEN_ID)?.encryptedToken as string, key).refreshToken,
  ).toBe("new-refresh")
  expect(docs.get(TOKEN_ID)?.refreshStartedAt).toBeUndefined()
  expect(await accessToken(client)).toBe("new-access")
  expect(request).toHaveBeenCalledTimes(1)
})

test("an interrupted refresh requires reconnection and never reuses the consumed token", async () => {
  const { client, docs } = fixture()
  const key = "ab".repeat(32)
  vi.stubEnv("CANVA_TOKEN_ENCRYPTION_KEY", key)
  vi.stubEnv("CANVA_CLIENT_ID", "client")
  vi.stubEnv("CANVA_CLIENT_SECRET", "client-secret")
  await client.createIfNotExists({
    _id: TOKEN_ID,
    _type: "weeklyCanvaOAuth",
    encryptedToken: sealToken(
      { accessToken: "old", refreshToken: "old-refresh", expiresAt: 0 },
      key,
    ),
  })
  const request = vi.fn(async () => {
    throw new Error("Network interrupted")
  })
  vi.stubGlobal("fetch", request)
  await expect(accessToken(client)).rejects.toThrow("Network interrupted")
  expect(docs.get(TOKEN_ID)?.refreshStartedAt).toBeTruthy()
  await expect(accessToken(client)).rejects.toThrow("reconnect")
  expect(request).toHaveBeenCalledTimes(1)
})

test("merge polling retries resume the saved merge instead of inserting pages twice", async () => {
  const { client, deps, canva } = fixture()
  canva.poll
    .mockImplementationOnce(async () => ({
      id: "job",
      status: "success",
      result: { design },
    }))
    .mockImplementationOnce(async () => ({
      id: "job",
      status: "success",
      result: { design },
    }))
    .mockImplementationOnce(async () => ({
      id: "job",
      status: "success",
      result: { design },
    }))
    .mockRejectedValueOnce(new Error("Merge polling timeout"))
  await expect(
    runWeekly(client, { monday: "2026-10-12" }, deps),
  ).rejects.toThrow("Merge polling timeout")
  expect(canva.merge).toHaveBeenCalledTimes(1)
  await runWeekly(client, { monday: "2026-10-12" }, deps)
  expect(canva.merge).toHaveBeenCalledTimes(3)
})

test("Slack receives the review link and week number through the configured webhook", async () => {
  fixture()
  const request = vi.fn(async () => new Response("ok"))
  vi.stubGlobal("fetch", request)
  await notifyWeek(weekFor(new Date(), "2026-10-12"), design)
  const [url, options] = request.mock.calls[0] as unknown as [
    string,
    RequestInit,
  ]
  expect(url).toBe("https://hooks.slack.com/services/test/test/test")
  expect(options.method).toBe("POST")
  const payload = JSON.parse(options.body as string)
  expect(payload.blocks[0].text.text).toBe(
    "Eg he laga utkast te ukas innlegg 42. Sjå øve, takk.",
  )
  expect(payload.text).toContain(design.urls.edit_url)
  expect(payload.blocks[1].text.text).toContain(design.urls.edit_url)
})

test("Slack rejection does not count as successful delivery", async () => {
  fixture()
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("invalid_payload", { status: 400 })),
  )
  await expect(
    notifyWeek(weekFor(new Date(), "2026-10-12"), design),
  ).rejects.toThrow("Slack delivery failed")
})
