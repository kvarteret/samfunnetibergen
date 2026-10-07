import type { SanityClient } from "@sanity/client"
import { describe, expect, test, vi } from "vitest"
import {
  formFromExtraction,
  INTERVAL_MS,
  importEvents,
  isDue,
  runTicketCoImport,
} from "./importer"
import type { Extraction, ImportTaxonomy } from "./luna"
import { matchBookingRoom, overlappingRooms } from "./rooms"
import {
  approvedImageUrl,
  canonicalTicketUrl,
  pageText,
  parseListing,
  ticketDocumentId,
} from "./source"

const url = "https://asf.ticketco.events/no/nb/e/concert"
const taxonomy: ImportTaxonomy = {
  rooms: [
    { _id: "tegl", name: "Teglverket", crescatRoomId: 97 },
    { _id: "tivoli", name: "Tivoli", crescatRoomId: 95 },
  ],
  groups: [],
  eventTypes: [],
}
const extraction: Extraction = {
  title: "KNEKT",
  titleEnglish: "KNEKT",
  description: "En konsert.",
  descriptionEnglish: "A concert.",
  startDate: "2099-10-16",
  startTime: "21:00",
  endTime: "01:00",
  room: "tegl",
  roomText: "",
  roomTextEnglish: "",
  organizerGroup: "",
  organizerText: "",
  organizerTextEnglish: "",
  submittedByOrganization: "",
  eventTypeId: "",
  isFree: false,
  isSoldOut: false,
  priceOrdinar: "200",
  priceStudent: "150",
  priceMedlem: "100",
  facebookUrl: "",
  evidence: "Displayed schedule",
}
const booking = {
  id: 1,
  resourceId: 97,
  event_id: 1,
  start: "2099-10-16 20:00:00",
  end: "2099-10-17 02:00:00",
  color: "",
  title: "KNEKT konsert",
  part_of_event: true,
}

function fixtureClient(existing: { ticketUrl: string }[] = []) {
  const docs = new Map<string, Record<string, unknown>>()
  const create = vi.fn(async (doc: { _id: string }) => {
    if (!docs.has(doc._id)) docs.set(doc._id, doc)
    return docs.get(doc._id)
  })
  const client = {
    fetch: vi.fn(async (query: string) =>
      query.includes('"rooms":') ? taxonomy : existing,
    ),
    getDocument: vi.fn(async (id: string) => docs.get(id)),
    createIfNotExists: create,
  }
  return { client: client as unknown as SanityClient, docs, create }
}
const dependencies = () => ({
  discover: vi.fn(async () => [
    {
      "@type": "Event" as const,
      name: "KNEKT",
      url,
      startDate: "2099-10-16T21:00:00Z",
    },
  ]),
  extract: vi.fn(async () => ({ ...extraction })),
  fetchPage: vi.fn(async () => "<body>Doors open 21:00. Close 01:00.</body>"),
  calendar: vi.fn(async () => [booking]),
})

describe("TicketCo source", () => {
  test("canonicalizes locale, tracking and trailing slash, rejecting other hosts", () => {
    expect(
      canonicalTicketUrl(`${url.replace("/nb/", "/en/")}/?utm_source=x#foo`),
    ).toBe(url)
    expect(ticketDocumentId(url)).toBe(
      ticketDocumentId(url.replace("/nb/", "/en/")),
    )
    expect(
      canonicalTicketUrl("https://ticketco.events.evil.test/no/nb/e/concert"),
    ).toBeNull()
    expect(
      canonicalTicketUrl("https://user@asf.ticketco.events/no/nb/e/concert"),
    ).toBeNull()
    expect(
      approvedImageUrl("https://tuploads.s3.amazonaws.com/image.png"),
    ).toBe(true)
    expect(approvedImageUrl("http://127.0.0.1/image.png")).toBe(false)
  })
  test("reads JSON-LD with either quote style, graph and duplicate links", () => {
    const event = { "@type": "Event", name: "A", url }
    const html = `<script type='application/ld+json'>${JSON.stringify({ "@graph": [event, { ...event, url: url.replace("/nb/", "/en/") }] })}</script><a rel='next' href='/no/nb?pattern=kvarter&amp;page=2'>Next</a>`
    expect(parseListing(html).events).toHaveLength(1)
    expect(parseListing(html).next).toBe(
      "https://ticketco.events/no/nb?pattern=kvarter&page=2",
    )
    expect(
      pageText("<body><script>evil()</script><p>Rock &amp; Roll</p></body>"),
    ).toBe("Rock & Roll")
  })
})

describe("room matching and validation", () => {
  test("uses overnight overlaps and title matches rather than unrelated simultaneous bookings", () => {
    const candidates = overlappingRooms(
      "2099-10-16",
      "21:00",
      "01:00",
      [booking, { ...booking, id: 2, resourceId: 95, title: "Board meeting" }],
      taxonomy.rooms,
    )
    expect(matchBookingRoom("KNEKT", candidates)).toBe("tegl")
    expect(matchBookingRoom("Other concert", candidates)).toBeNull()
    expect(
      matchBookingRoom("KNEKT", [
        ...candidates,
        { ...candidates[0], roomId: "tivoli", resourceId: 95 },
      ]),
    ).toBeNull()
    expect(
      overlappingRooms(
        "2099-10-16",
        "21:00",
        "01:00",
        [{ ...booking, end: "2099-10-16 21:00:00" }],
        taxonomy.rooms,
      ),
    ).toEqual([])
  })
  test("requires actual door times and valid taxonomy, preserves fixed identity", () => {
    expect(() =>
      formFromExtraction({ ...extraction, endTime: "" }, url, taxonomy, []),
    ).toThrow()
    expect(() =>
      formFromExtraction(
        { ...extraction, room: "invented" },
        url,
        taxonomy,
        [],
      ),
    ).toThrow()
    expect(formFromExtraction(extraction, url, taxonomy, [])).toMatchObject({
      submittedBy: "E-tjenesten's Skonk",
      submittedByEmail: "it.leder@kvarteret.no",
      ticketUrl: url,
    })
  })
})

describe("imports", () => {
  test("retries safely without duplicate documents or overwriting editorial content", async () => {
    const fixture = fixtureClient()
    const first = await importEvents(fixture.client, false, dependencies())
    expect(first).toMatchObject({ imported: 1, failed: [] })
    const doc = fixture.docs.get(ticketDocumentId(url))
    expect(doc).toMatchObject({
      approvalStatus: "pending",
      room: { _ref: "tegl" },
      ticketUrl: url,
      priceOrdinar: 200,
    })
    const secondDeps = dependencies()
    const second = await importEvents(fixture.client, false, secondDeps)
    expect(second.skipped).toBe(1)
    expect(secondDeps.extract).not.toHaveBeenCalled()
    expect(fixture.create).toHaveBeenCalledOnce()
    expect(fixture.docs.get(ticketDocumentId(url))).toBe(doc)
  })
  test("deduplicates against manually submitted locale variants", async () => {
    const fixture = fixtureClient([
      { ticketUrl: url.replace("/nb/", "/en/") + "?tracking=1" },
    ])
    expect(
      (await importEvents(fixture.client, false, dependencies())).skipped,
    ).toBe(1)
    expect(fixture.create).not.toHaveBeenCalled()
  })
  test("dry-run validates but never writes scheduler state or events", async () => {
    const fixture = fixtureClient()
    expect(
      (
        await runTicketCoImport(
          fixture.client,
          { dryRun: true },
          dependencies(),
        )
      ).imported,
    ).toBe(1)
    expect(fixture.create).not.toHaveBeenCalled()
  })
  test("missing end time creates nothing and is reported for retry", async () => {
    const fixture = fixtureClient()
    const deps = dependencies()
    deps.extract.mockResolvedValue({ ...extraction, endTime: "" })
    const report = await importEvents(fixture.client, false, deps)
    expect(report.failed).toHaveLength(1)
    expect(fixture.create).not.toHaveBeenCalled()
  })
  test("72-hour schedule survives month boundaries", () => {
    const start = Date.parse("2026-10-31T05:17:00Z")
    expect(isDue(new Date(start).toISOString(), start + INTERVAL_MS - 1)).toBe(
      false,
    )
    expect(isDue(new Date(start).toISOString(), start + INTERVAL_MS)).toBe(true)
  })
})

test("ignores calendar bookings whose titles are hidden", () => {
  const candidates = overlappingRooms(
    "2099-10-16",
    "21:00",
    "01:00",
    [{ ...booking, title: undefined as unknown as string }],
    taxonomy.rooms,
  )
  expect(matchBookingRoom("KNEKT", candidates)).toBeNull()
})

describe("scheduler recovery", () => {
  test("scheduled slots dedupe by local date and bypass the manual 72-hour guard", async () => {
    const fixture = fixtureClient()
    const deps = dependencies()
    deps.discover.mockResolvedValue([])
    const patch = {
      ifRevisionId: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      unset: vi.fn().mockReturnThis(),
      commit: vi.fn(async () => ({ _rev: "lease" })),
    }
    const state = {
      _id: "ticketco-import-state",
      _rev: "state",
      lastSuccessAt: new Date().toISOString(),
    }
    const client = {
      ...fixture.client,
      patch: vi.fn(() => patch),
      getDocument: vi.fn(async () => state),
    } as unknown as SanityClient
    const now = new Date("2026-10-10T16:00:00Z")
    expect(
      (await runTicketCoImport(client, { scheduled: true, now }, deps)).status,
    ).toBe("complete")
    expect(patch.set).toHaveBeenCalledWith({ lastScheduledSlot: "2026-10-10" })
    vi.mocked(client.getDocument).mockResolvedValue({
      ...state,
      _type: "ticketcoImportState",
      _createdAt: "",
      _updatedAt: "",
      lastScheduledSlot: "2026-10-10",
    })
    deps.discover.mockClear()
    expect(
      (await runTicketCoImport(client, { scheduled: true, now }, deps)).status,
    ).toBe("not-due")
    expect(deps.discover).not.toHaveBeenCalled()
  })

  test("does not run before due or while another runner holds the lease", async () => {
    const fixture = fixtureClient()
    const deps = dependencies()
    const client = {
      ...fixture.client,
      getDocument: vi.fn(async () => ({
        _id: "ticketco-import-state",
        _rev: "rev",
        lastSuccessAt: new Date().toISOString(),
      })),
    } as unknown as SanityClient
    expect((await runTicketCoImport(client, {}, deps)).status).toBe("not-due")
    expect(deps.discover).not.toHaveBeenCalled()
    vi.mocked(client.getDocument).mockResolvedValue({
      _id: "ticketco-import-state",
      _type: "ticketcoImportState",
      _rev: "rev",
      _createdAt: "",
      _updatedAt: "",
      leaseUntil: new Date(Date.now() + 60000).toISOString(),
    })
    expect(
      (await runTicketCoImport(client, { force: true }, deps)).status,
    ).toBe("busy")
    expect(deps.discover).not.toHaveBeenCalled()
  })
  test("partial failures release the lease without advancing the success timestamp", async () => {
    const fixture = fixtureClient()
    const deps = dependencies()
    deps.extract.mockResolvedValue({ ...extraction, endTime: "" })
    const patch = {
      ifRevisionId: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      unset: vi.fn().mockReturnThis(),
      commit: vi.fn(async () => ({ _rev: "lease" })),
    }
    const client = {
      ...fixture.client,
      patch: vi.fn(() => patch),
      getDocument: vi.fn(async (id: string) =>
        id === "ticketco-import-state" ? { _id: id, _rev: "state" } : undefined,
      ),
    } as unknown as SanityClient
    const report = await runTicketCoImport(client, {}, deps)
    expect(report.failed).toHaveLength(1)
    expect(patch.unset).toHaveBeenCalledWith(["owner", "leaseUntil"])
    expect(patch.set).not.toHaveBeenCalledWith({
      lastSuccessAt: expect.any(String),
    })
  })
})

test("selects Teglverket over its support rooms for the same Crescat event", () => {
  const candidates = overlappingRooms(
    "2099-10-16",
    "21:00",
    "01:00",
    [booking, { ...booking, resourceId: 117 }],
    [...taxonomy.rooms, { _id: "stoy", name: "Støy", crescatRoomId: 117 }],
  )
  expect(matchBookingRoom("KNEKT", candidates)).toBe("tegl")
  expect(
    matchBookingRoom(
      "KNEKT",
      candidates.map(candidate =>
        candidate.roomId === "stoy" ? { ...candidate, eventId: 2 } : candidate,
      ),
    ),
  ).toBeNull()
})

test("requires room references, clears location free text and rejects missing paid prices", () => {
  expect(() =>
    formFromExtraction({ ...extraction, room: "" }, url, taxonomy, []),
  ).toThrow("Room could not be determined")
  expect(
    formFromExtraction(
      { ...extraction, roomText: "Kvarteret", roomTextEnglish: "Kvarteret" },
      url,
      taxonomy,
      [],
    ),
  ).toMatchObject({ room: "tegl", roomText: "", roomTextEnglish: "" })
  expect(() =>
    formFromExtraction(
      { ...extraction, priceOrdinar: "", priceStudent: "", priceMedlem: "" },
      url,
      taxonomy,
      [],
    ),
  ).toThrow("Ticket price could not be determined")
})

test("resolves a missing model room against overlapping Crescat bookings before writing", async () => {
  const fixture = fixtureClient()
  const deps = dependencies()
  deps.extract.mockResolvedValue({ ...extraction, room: "" })
  const report = await importEvents(fixture.client, false, deps)
  expect(report.failed).toEqual([])
  expect(fixture.docs.get(ticketDocumentId(url))).toMatchObject({
    room: { _ref: "tegl" },
    submittedBy: "E-tjenesten's Skonk",
    submittedByEmail: "it.leder@kvarteret.no",
  })
  expect(deps.calendar).toHaveBeenCalled()
})

test("never writes an event when room remains unresolved after calendar lookup and model retry", async () => {
  const fixture = fixtureClient()
  const deps = dependencies()
  deps.extract.mockResolvedValue({ ...extraction, room: "" })
  deps.calendar.mockResolvedValue([{ ...booking, title: "Unrelated booking" }])
  const report = await importEvents(fixture.client, false, deps)
  expect(report.imported).toBe(0)
  expect(report.failed).toEqual([
    { url, reason: "Room could not be determined" },
  ])
  expect(deps.extract).toHaveBeenCalledTimes(2)
  expect(fixture.create).not.toHaveBeenCalled()
})

test("imports explicitly sold-out sources with no price and a required room", async () => {
  const fixture = fixtureClient()
  const deps = dependencies()
  deps.fetchPage.mockResolvedValue(
    "<body>Det er ingen flere billetter tilgjengelig</body>",
  )
  deps.extract.mockResolvedValue({
    ...extraction,
    priceOrdinar: "",
    priceStudent: "",
    priceMedlem: "",
  })
  expect(await importEvents(fixture.client, false, deps)).toMatchObject({
    imported: 1,
    failed: [],
  })
  expect(fixture.docs.get(ticketDocumentId(url))).toMatchObject({
    isSoldOut: true,
    room: { _ref: "tegl" },
    submittedBy: "E-tjenesten's Skonk",
  })
  expect(fixture.docs.get(ticketDocumentId(url))).not.toHaveProperty(
    "priceOrdinar",
  )
})

test("uses the linked Sanity organizer instead of translated free text", () => {
  expect(
    formFromExtraction(
      {
        ...extraction,
        organizerGroup: "asf",
        organizerText: "Aktive Studenters Forening",
        organizerTextEnglish: "Active Students’ Association",
      },
      url,
      {
        ...taxonomy,
        groups: [{ _id: "asf", name: "Aktive Studenters Forening" }],
      },
      [],
    ),
  ).toMatchObject({
    organizerGroup: "asf",
    organizerText: "",
    organizerTextEnglish: "",
  })
})
