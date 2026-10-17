import type { SanityClient } from "@sanity/client"
import { describe, expect, test, vi } from "vitest"
import {
  formFromExtraction,
  INTERVAL_MS,
  importEvents,
  isDue,
  matchListingRoom,
  runTicketCoImport,
} from "./importer"
import type { Extraction, ImportTaxonomy } from "./luna"
import { mergeDuplicateListing } from "./merge"
import { bestEffortRoom, matchBookingRoom, overlappingRooms } from "./rooms"
import {
  approvedImageUrl,
  canonicalTicketUrl,
  pageText,
  parseListing,
  ticketDocumentId,
} from "./source"
import { captureRoomResolution } from "./telemetry"

vi.mock("./telemetry", () => ({ captureRoomResolution: vi.fn() }))
vi.mock("./merge", () => ({ mergeDuplicateListing: vi.fn() }))

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
    expect(captureRoomResolution).toHaveBeenLastCalledWith(
      expect.any(String),
      url,
      { status: "failed", reason: expect.stringContaining("dates.0.endTime") },
    )
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

test("leaves room and price empty for editors, and clears location free text", () => {
  expect(
    formFromExtraction({ ...extraction, room: "" }, url, taxonomy, []).room,
  ).toBe("")
  expect(
    formFromExtraction(
      { ...extraction, roomText: "Kvarteret", roomTextEnglish: "Kvarteret" },
      url,
      taxonomy,
      [],
    ),
  ).toMatchObject({ room: "tegl", roomText: "", roomTextEnglish: "" })
  expect(
    formFromExtraction(
      { ...extraction, priceOrdinar: "", priceStudent: "", priceMedlem: "" },
      url,
      taxonomy,
      [],
    ).priceOrdinar,
  ).toBe("")
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

test("uses the only room booked in Crescat when no title matches", async () => {
  const fixture = fixtureClient()
  const deps = dependencies()
  deps.extract.mockResolvedValue({ ...extraction, room: "" })
  deps.calendar.mockResolvedValue([{ ...booking, title: "" }])
  expect(await importEvents(fixture.client, false, deps)).toMatchObject({
    imported: 1,
    warnings: [],
  })
  expect(fixture.docs.get(ticketDocumentId(url))).toMatchObject({
    room: { _ref: "tegl" },
  })
  expect(deps.extract).toHaveBeenCalledOnce()
})

test("creates an editable draft for an unresolved room and preserves it on retry", async () => {
  const fixture = fixtureClient()
  const deps = dependencies()
  deps.extract.mockResolvedValue({ ...extraction, room: "" })
  deps.calendar.mockResolvedValue([
    { ...booking, title: "Unrelated" },
    { ...booking, id: 2, event_id: 2, resourceId: 95, title: "Other" },
  ])
  expect(await importEvents(fixture.client, false, deps)).toMatchObject({
    imported: 1,
    failed: [],
    warnings: [
      {
        url,
        reason:
          "Created draft: Room unresolved; select a room in Studio before approving",
      },
    ],
  })
  expect(deps.extract).toHaveBeenCalledTimes(2)
  const id = `drafts.${ticketDocumentId(url)}`
  const doc = fixture.docs.get(id)
  expect(doc).toMatchObject({
    _type: "arrangement",
    approvalStatus: "pending",
    ticketUrl: url,
    localizedTitle: expect.any(Array),
    dates: [expect.objectContaining({ startDate: extraction.startDate })],
  })
  expect(doc).not.toHaveProperty("room")
  expect(fixture.docs.has(ticketDocumentId(url))).toBe(false)
  expect(captureRoomResolution).toHaveBeenLastCalledWith(
    expect.any(String),
    url,
    {
      status: "draft",
      room: "",
      reason: expect.stringContaining("select a room in Studio"),
    },
  )
  if (doc) doc.localizedTitle = [{ language: "nb", value: "Edited title" }]
  const secondDeps = dependencies()
  expect(await importEvents(fixture.client, false, secondDeps)).toMatchObject({
    skipped: 1,
  })
  expect(secondDeps.extract).not.toHaveBeenCalled()
  expect(fixture.create).toHaveBeenCalledOnce()
  expect(fixture.docs.get(id)).toBe(doc)
})

test("creates a draft with no calendar candidates", async () => {
  const fixture = fixtureClient()
  const deps = dependencies()
  deps.extract.mockResolvedValue({ ...extraction, room: "" })
  deps.calendar.mockResolvedValue([])
  expect(await importEvents(fixture.client, false, deps)).toMatchObject({
    imported: 1,
    failed: [],
  })
  expect(fixture.docs.has(`drafts.${ticketDocumentId(url)}`)).toBe(true)
  expect(deps.extract).toHaveBeenCalledOnce()
})

test("missing-room dry-run reports a draft without writing", async () => {
  const fixture = fixtureClient()
  const deps = dependencies()
  deps.extract.mockResolvedValue({ ...extraction, room: "" })
  deps.calendar.mockResolvedValue([])
  expect(await importEvents(fixture.client, true, deps)).toMatchObject({
    imported: 1,
    failed: [],
    warnings: [{ url, reason: expect.stringContaining("Would create draft") }],
  })
  expect(fixture.create).not.toHaveBeenCalled()
  expect(captureRoomResolution).toHaveBeenLastCalledWith(
    expect.any(String),
    url,
    expect.objectContaining({ status: "dry-run", room: "" }),
  )
})

test("a save failure remains a failure even after resolving the room", async () => {
  const fixture = fixtureClient()
  fixture.create.mockRejectedValueOnce(new Error("save failed"))
  expect(
    await importEvents(fixture.client, false, dependencies()),
  ).toMatchObject({
    imported: 0,
    failed: [{ url, reason: expect.any(String) }],
  })
  expect(captureRoomResolution).toHaveBeenLastCalledWith(
    expect.any(String),
    url,
    expect.objectContaining({
      status: "failed",
      room: "tegl",
      reason: expect.any(String),
    }),
  )
})

test("a missing-room import with an image cannot merge into an existing show", async () => {
  const fixture = fixtureClient()
  const deps = dependencies()
  deps.extract.mockResolvedValue({ ...extraction, room: "" })
  deps.calendar.mockResolvedValue([])
  deps.fetchPage.mockResolvedValue(
    '<meta property="og:image" content="https://tuploads.s3.amazonaws.com/image.png">',
  )
  const upload = vi.fn(async () => ({ _id: "image-asset" }))
  Object.assign(fixture.client, { assets: { upload } })
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response("image", { headers: { "content-type": "image/png" } }),
    ),
  )
  try {
    expect(await importEvents(fixture.client, false, deps)).toMatchObject({
      imported: 1,
      merged: 0,
    })
    expect(upload).toHaveBeenCalledOnce()
    expect(mergeDuplicateListing).not.toHaveBeenCalled()
    expect(fixture.docs.get(`drafts.${ticketDocumentId(url)}`)).toMatchObject({
      image: { asset: { _ref: "image-asset" } },
    })
  } finally {
    vi.unstubAllGlobals()
  }
})

test("Teglverket's bundled support rooms do not make the fallback ambiguous", () => {
  const candidates = overlappingRooms(
    "2099-10-16",
    "21:00",
    "01:00",
    [booking, { ...booking, id: 2, resourceId: 117 }],
    [...taxonomy.rooms, { _id: "stoy", name: "Støy", crescatRoomId: 117 }],
  )
  expect(bestEffortRoom(candidates)).toBe("tegl")
  expect(bestEffortRoom([])).toBeNull()
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

test("matches the room booked under the organizer's name when the title does not", () => {
  const rooms = [
    ...taxonomy.rooms,
    { _id: "storelogen", name: "Storelogen", crescatRoomId: 23 },
    { _id: "speilsalen", name: "Speilsalen", crescatRoomId: 96 },
  ]
  const groups = [{ _id: "immaturus", name: "Studentteateret Immaturus" }]
  // Real Crescat bookings for «Hvor er Tassi?!?!», 2026-10-23 19:00–20:00.
  const candidates = overlappingRooms(
    "2099-10-23",
    "19:00",
    "20:00",
    [
      {
        ...booking,
        resourceId: 95,
        event_id: 2,
        start: "2099-10-23 12:00:00",
        end: "2099-10-23 23:59:00",
        title: "BIFF 2026",
      },
      {
        ...booking,
        resourceId: 97,
        event_id: 3,
        start: "2099-10-23 12:00:00",
        end: "2099-10-24 03:00:00",
        title: "ASF - HLNA",
      },
      {
        ...booking,
        resourceId: 23,
        event_id: 4,
        start: "2099-10-23 16:30:00",
        end: "2099-10-23 23:45:00",
        title: "Immaturus - Mikroproduksjon",
      },
      {
        ...booking,
        resourceId: 96,
        event_id: 5,
        start: "2099-10-23 18:30:00",
        end: "2099-10-24 00:00:00",
        title: "Bursdagsfeiring",
      },
    ],
    rooms,
  )
  const listing = {
    title: "Hvor er Tassi?!?!",
    organizerGroup: "immaturus",
    organizerText: "",
    submittedByOrganization: "",
  }
  expect(bestEffortRoom(candidates)).toBeNull()
  expect(
    matchListingRoom(listing, { ...taxonomy, rooms, groups }, candidates),
  ).toBe("storelogen")
  expect(
    matchListingRoom(
      {
        ...listing,
        organizerGroup: "",
        submittedByOrganization: "Studentteateret Immaturus",
      },
      { ...taxonomy, rooms },
      candidates,
    ),
  ).toBe("storelogen")
  expect(
    matchListingRoom(
      { ...listing, organizerGroup: "" },
      { ...taxonomy, rooms },
      candidates,
    ),
  ).toBeNull()
})
