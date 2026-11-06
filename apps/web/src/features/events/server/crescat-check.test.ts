import type { SanityClient } from "@sanity/client"
import { describe, expect, it, vi } from "vitest"
import type { CresatBooking } from "@/lib/integrations/crescat/calendar"
import {
  buildCrescatCheck,
  type CheckableRequest,
  latestRequests,
  scanPendingRequests,
} from "./crescat-check"

vi.mock("@/lib/posthog-server", () => ({
  getPostHogClient: () => ({ captureException: vi.fn() }),
}))

const ROOMS = new Map([
  [95, "Tivoli"],
  [97, "Teglverket"],
  [119, "Grøndahls"],
])

let nextId = 1
function booking(
  resourceId: number,
  start: string,
  end: string,
  title: string,
): CresatBooking {
  const id = nextId++
  return {
    id,
    event_id: id,
    resourceId,
    start,
    end,
    title,
    color: "",
    part_of_event: false,
  }
}

function request(
  title: string,
  crescatRoomId: number | null,
  dates: CheckableRequest["dates"],
  extra: Partial<CheckableRequest> = {},
): CheckableRequest {
  return {
    _id: "req-1",
    localizedTitle: [{ language: "nb", value: title }],
    crescatRoomId,
    room: crescatRoomId ? { _ref: `room-${crescatRoomId}` } : null,
    dates,
    ...extra,
  }
}

const check = (req: CheckableRequest, bookings: CresatBooking[]) =>
  buildCrescatCheck(req, bookings, ROOMS, "2026-11-06T10:00:00.000Z")

describe("Crescat request check", () => {
  it("is green when the same room is booked under a similar name", () => {
    const result = check(
      request("Henlagt: Samtykkeloven", 95, [
        { startDate: "2026-11-05", startTime: "18:00", endTime: "20:00" },
      ]),
      [
        booking(
          95,
          "2026-11-05T16:00:00",
          "2026-11-05T20:30:00",
          "Debatt // Samtykkeloven",
        ),
      ],
    )
    expect(result?.status).toBe("found")
    expect(result?.dates[0].matches[0]).toMatchObject({
      title: "Debatt // Samtykkeloven",
      room: "Tivoli",
    })
  })

  it("is green when a same-room booking covers the time, whatever its name", () => {
    const result = check(
      request("Dagens Afghanistan", 119, [
        { startDate: "2026-11-03", startTime: "08:30", endTime: "09:30" },
      ]),
      [
        booking(
          119,
          "2026-11-03T08:00:00",
          "2026-11-03T10:00:00",
          "Aktuelt - frokostmøte",
        ),
      ],
    )
    expect(result?.status).toBe("found")
  })

  it("handles events that run past midnight", () => {
    const result = check(
      request("Halloween-helhus", 97, [
        { startDate: "2026-10-31", startTime: "21:00", endTime: "03:00" },
      ]),
      [
        booking(
          97,
          "2026-10-31T14:00:00",
          "2026-11-01T03:00:00",
          "HALLOWEEN - HELHUS",
        ),
      ],
    )
    expect(result?.status).toBe("found")
  })

  it("is orange when a same-room booking only partly overlaps", () => {
    const result = check(
      request("Konsert", 97, [
        { startDate: "2026-11-12", startTime: "20:00", endTime: "23:30" },
      ]),
      [booking(97, "2026-11-12T14:00:00", "2026-11-12T20:30:00", "Lysrigging")],
    )
    expect(result?.status).toBe("maybe")
    expect(result?.dates[0].reason).toMatch(/deler av tiden/)
  })

  it("is orange when a similar name is booked in another room", () => {
    const result = check(
      request("Blood Command", 95, [
        { startDate: "2026-11-27", startTime: "21:00", endTime: "23:30" },
      ]),
      [
        booking(
          97,
          "2026-11-27T18:00:00",
          "2026-11-28T01:00:00",
          "Blood Command",
        ),
      ],
    )
    expect(result?.status).toBe("maybe")
    expect(result?.dates[0].reason).toMatch(/annet rom/)
  })

  it("is orange for a roomless request with a similar booking", () => {
    const result = check(
      request("Fusjonsgalla", null, [
        { startDate: "2026-10-26", startTime: "17:15", endTime: "00:00" },
      ]),
      [
        booking(
          23,
          "2026-10-26T15:00:00",
          "2026-10-27T01:00:00",
          "Fusjonsgalla 2026",
        ),
      ],
    )
    expect(result?.status).toBe("maybe")
  })

  it("is orange when a similar name is booked the same day at another time", () => {
    const result = check(
      request("Skeiv kultur", 97, [
        { startDate: "2026-11-25", startTime: "18:00", endTime: "19:00" },
      ]),
      [
        booking(
          96,
          "2026-11-25T12:00:00",
          "2026-11-25T14:00:00",
          "Skeiv lunsj",
        ),
      ],
    )
    expect(result?.status).toBe("maybe")
    expect(result?.dates[0].reason).toMatch(/annet tidspunkt/)
  })

  it("matches on the organizer when the booking is named after it", () => {
    const result = check(
      request(
        "Protester og presidentvalg",
        95,
        [{ startDate: "2026-11-10", startTime: "08:15", endTime: "09:45" }],
        { submittedByOrganization: "Aktuelt" },
      ),
      [
        booking(
          119,
          "2026-11-10T08:00:00",
          "2026-11-10T10:00:00",
          "Aktuelt - frokostmøte",
        ),
      ],
    )
    expect(result?.status).toBe("maybe")
  })

  it("is red when nothing relevant is booked", () => {
    const result = check(
      request("Skeiv kultur", 97, [
        { startDate: "2026-11-25", startTime: "18:00", endTime: "19:00" },
      ]),
      [
        booking(97, "2026-11-24T18:00:00", "2026-11-24T22:00:00", "Quiz"),
        booking(
          95,
          "2026-11-25T18:00:00",
          "2026-11-25T22:00:00",
          "Filmvisning",
        ),
      ],
    )
    expect(result?.status).toBe("missing")
    expect(result?.dates[0].matches).toEqual([])
  })

  it("rolls several dates up to orange when only some are booked", () => {
    const result = check(
      request("Don Juan", 95, [
        { startDate: "2026-11-14", startTime: "18:40", endTime: "21:30" },
        { startDate: "2026-11-16", startTime: "18:40", endTime: "21:30" },
      ]),
      [booking(95, "2026-11-14T16:00:00", "2026-11-14T22:00:00", "Don Juan")],
    )
    expect(result?.status).toBe("maybe")
    expect(result?.dates.map(date => date.status)).toEqual(["found", "missing"])
  })

  it("skips requests without dates", () => {
    expect(check(request("Festival", 97, null), [])).toBeNull()
  })

  it("prefers an editor's draft over the submitted original", () => {
    const original = request("A", 95, [])
    const draft = { ...request("B", 97, []), _id: "drafts.req-1" }
    expect(latestRequests([draft, original])).toEqual([draft])
    expect(latestRequests([original, draft])).toEqual([draft])
  })
})

describe("scanPendingRequests", () => {
  const pending = request("Henlagt: Samtykkeloven", 95, [
    { startDate: "2026-11-05", startTime: "18:00", endTime: "20:00" },
  ])
  const deps = (bookings: CresatBooking[]) => ({
    calendar: vi.fn(async () => bookings),
    resources: vi.fn(async () => [
      { id: 95, title: "Tivoli", room_title: null },
    ]),
    now: () => new Date("2026-11-06T10:00:00.000Z"),
  })

  /** Pending requests, plus the arrangement ids already checked. */
  const sanityFetch = (checked: string[] = []) =>
    vi.fn(async (query: string) =>
      query.includes('_type == "crescatCheck"') ? checked : [pending],
    )

  it("checks each request only once", async () => {
    const createOrReplace = vi.fn()
    const calendar = vi.fn(async () => [])
    const client = {
      fetch: sanityFetch(["req-1"]),
      createOrReplace,
    } as unknown as SanityClient
    const report = await scanPendingRequests(
      client,
      {},
      {
        ...deps([]),
        calendar,
      },
    )
    expect(report).toMatchObject({ checked: 0, alreadyChecked: 1 })
    expect(calendar).not.toHaveBeenCalled()
    expect(createOrReplace).not.toHaveBeenCalled()
  })

  it("checks named requests even if they were checked before", async () => {
    const createOrReplace = vi.fn(async () => ({}))
    const client = {
      fetch: sanityFetch(["req-1"]),
      createOrReplace,
    } as unknown as SanityClient
    const report = await scanPendingRequests(
      client,
      { ids: ["req-1"] },
      deps([booking(95, "2026-11-05T16:00:00", "2026-11-05T20:30:00", "X")]),
    )
    expect(report).toMatchObject({ checked: 1, alreadyChecked: 0 })
    expect(createOrReplace).toHaveBeenCalledOnce()
  })

  it("stores one check per request in a private document", async () => {
    const createOrReplace = vi.fn(async () => ({}))
    const client = {
      fetch: sanityFetch(),
      createOrReplace,
    } as unknown as SanityClient
    const report = await scanPendingRequests(
      client,
      {},
      deps([
        booking(95, "2026-11-05T16:00:00", "2026-11-05T20:30:00", "Debatt"),
      ]),
    )
    expect(report).toMatchObject({ checked: 1, found: 1 })
    expect(createOrReplace).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: "crescatCheck.req-1",
        _type: "crescatCheck",
        arrangementId: "req-1",
        status: "found",
      }),
    )
  })

  it("does not write anything in a dry run", async () => {
    const createOrReplace = vi.fn()
    const client = {
      fetch: sanityFetch(),
      createOrReplace,
    } as unknown as SanityClient
    const report = await scanPendingRequests(
      client,
      { dryRun: true },
      deps([booking(95, "2026-11-05T16:00:00", "2026-11-05T20:30:00", "X")]),
    )
    expect(report.results?.[0].status).toBe("found")
    expect(createOrReplace).not.toHaveBeenCalled()
  })

  it("refuses to paint everything red when Crescat returns nothing", async () => {
    const createOrReplace = vi.fn()
    const client = {
      fetch: sanityFetch(),
      createOrReplace,
    } as unknown as SanityClient
    await expect(scanPendingRequests(client, {}, deps([]))).rejects.toThrow(
      /no bookings/,
    )
    expect(createOrReplace).not.toHaveBeenCalled()
  })
})
