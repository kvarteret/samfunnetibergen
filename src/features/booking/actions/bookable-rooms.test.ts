import { beforeEach, describe, expect, test, vi } from "vitest"
import type { BookingRoom } from "@/features/booking/types"
import type { BookableRoom } from "@/lib/sanity/fetch/rooms"
import type { CresatResource } from "@/lib/integrations/crescat/calendar"

// ── Mock modules ────────────────────────────────────────────────────────────

vi.mock("@/lib/integrations/crescat/calendar", () => ({
  calendarSlugForBookerType: vi.fn((type: string) =>
    type === "intern"
      ? "studentersamfunnet-i-bergen-bookingkalender-privat"
      : "studentersamfunnet-i-bergen-bookingkalender",
  ),
  fetchVenueResources: vi.fn(),
}))

vi.mock("@/lib/sanity/fetch", () => ({
  fetchBookableRooms: vi.fn(),
}))

import { fetchBookableRoomsForBooker } from "@/features/booking/actions/bookable-rooms"
import {
  calendarSlugForBookerType,
  fetchVenueResources,
} from "@/lib/integrations/crescat/calendar"
import { fetchBookableRooms } from "@/lib/sanity/fetch"

// ── Helpers ─────────────────────────────────────────────────────────────────

function sanityRoom(
  overrides: Partial<BookingRoom & { crescatRoomId: number }>,
): BookableRoom {
  return {
    crescatRoomId: overrides.crescatRoomId ?? 0,
    title: overrides.title ?? `Rom ${overrides.crescatRoomId}`,
    slug: overrides.slug ?? `rom-${overrides.crescatRoomId}`,
    summary: overrides.summary ?? "Et fint rom.",
    capacityStanding: overrides.capacityStanding ?? 100,
    capacitySeated: overrides.capacitySeated ?? 50,
    openingHours: overrides.openingHours ?? null,
    image: overrides.image ?? {
      assetUrl: "https://ex.com/img.jpg",
      alt: "Foto",
    },
    source: "sanity",
    floor: overrides.floor ?? null,
    suitedPurposes: overrides.suitedPurposes ?? [],
    bar: overrides.bar ?? null,
    hasSound: overrides.hasSound ?? false,
    soundDetails: overrides.soundDetails ?? null,
    hasLighting: overrides.hasLighting ?? false,
    lightingDetails: overrides.lightingDetails ?? null,
    hasAV: overrides.hasAV ?? false,
    avDetails: overrides.avDetails ?? null,
  } as unknown as BookableRoom
}

function crescatResource(id: number, title: string): CresatResource {
  return { id, room_title: null, title }
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("fetchBookableRoomsForBooker", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("sanity-enriched room has source sanity", async () => {
    vi.mocked(fetchVenueResources).mockResolvedValue([
      crescatResource(95, "Tivoli"),
    ])
    vi.mocked(fetchBookableRooms).mockResolvedValue([
      sanityRoom({ crescatRoomId: 95 }),
    ])

    const rooms = await fetchBookableRoomsForBooker("ekstern")
    expect(rooms).toHaveLength(1)
    expect(rooms[0].source).toBe("sanity")
    expect(rooms[0].title).toBe("Rom 95")
  })

  test("crescat-only room has source crescat", async () => {
    vi.mocked(fetchVenueResources).mockResolvedValue([
      crescatResource(125, "Garderobe"),
    ])
    vi.mocked(fetchBookableRooms).mockResolvedValue([])

    const rooms = await fetchBookableRoomsForBooker("intern")
    expect(rooms).toHaveLength(1)
    expect(rooms[0].source).toBe("crescat")
    expect(rooms[0].title).toBe("Garderobe")
    expect(rooms[0].slug).toBeNull()
    expect(rooms[0].summary).toBeNull()
    expect(rooms[0].image).toBeNull()
  })

  test("preserves /resources order", async () => {
    vi.mocked(fetchVenueResources).mockResolvedValue([
      crescatResource(98, "Maos"),
      crescatResource(96, "Speilsalen"),
      crescatResource(95, "Tivoli"),
    ])
    vi.mocked(fetchBookableRooms).mockResolvedValue([
      sanityRoom({ crescatRoomId: 95 }),
      sanityRoom({ crescatRoomId: 96 }),
      sanityRoom({ crescatRoomId: 98 }),
    ])

    const rooms = await fetchBookableRoomsForBooker("ekstern")
    // Sanity rooms first, then Crescat-only — but here all are Sanity, so
    // /resources order is preserved within the Sanity group.
    expect(rooms.map(r => r.crescatRoomId)).toEqual([98, 96, 95])
  })

  test("sanity rooms sorted before crescat-only rooms", async () => {
    vi.mocked(fetchVenueResources).mockResolvedValue([
      crescatResource(125, "Garderobe"),
      crescatResource(95, "Tivoli"),
      crescatResource(120, "Grøndahls"),
    ])
    vi.mocked(fetchBookableRooms).mockResolvedValue([
      sanityRoom({ crescatRoomId: 95 }),
    ])

    const rooms = await fetchBookableRoomsForBooker("intern")
    expect(rooms.map(r => r.crescatRoomId)).toEqual([95, 125, 120])
  })

  test("empty /resources falls back to Sanity rooms", async () => {
    vi.mocked(fetchVenueResources).mockResolvedValue([])
    vi.mocked(fetchBookableRooms).mockResolvedValue([
      sanityRoom({ crescatRoomId: 95 }),
      sanityRoom({ crescatRoomId: 96 }),
    ])

    const rooms = await fetchBookableRoomsForBooker("ekstern")
    expect(rooms).toHaveLength(2)
    expect(rooms.every(r => r.source === "sanity")).toBe(true)
  })

  test("ekstern uses standard calendar", () => {
    expect(calendarSlugForBookerType("ekstern")).toBe(
      "studentersamfunnet-i-bergen-bookingkalender",
    )
    expect(calendarSlugForBookerType("studentorg")).toBe(
      "studentersamfunnet-i-bergen-bookingkalender",
    )
  })

  test("intern uses privat calendar", () => {
    expect(calendarSlugForBookerType("intern")).toBe(
      "studentersamfunnet-i-bergen-bookingkalender-privat",
    )
  })
})
