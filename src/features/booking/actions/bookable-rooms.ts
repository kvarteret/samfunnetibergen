"use server"

import {
  calendarSlugForBookerType,
  fetchVenueResources,
} from "@/lib/integrations/crescat/calendar"
import { fetchBookableRooms } from "@/lib/sanity/fetch"
import type { BookerType } from "../domain/formState"
import type { BookingRoom } from "../types"

// Bookable rooms for a booker type. The list comes from Crescat's /resources for
// the booker's calendar (the authoritative bookable set), enriched with Sanity
// content matched by crescatRoomId. Rooms that exist only in Crescat are still
// offered, as minimal cards. If Crescat is unreachable (/resources empty), fall
// back to the Sanity bookable rooms so the picker is never empty.
export async function fetchBookableRoomsForBooker(
  bookerType: BookerType,
): Promise<BookingRoom[]> {
  const calendarSlug = calendarSlugForBookerType(bookerType)
  const [resources, sanityRooms] = await Promise.all([
    fetchVenueResources(calendarSlug),
    fetchBookableRooms(),
  ])

  const sanityById = new Map(
    sanityRooms.map(room => [room.crescatRoomId, room] as const),
  )

  if (resources.length === 0) {
    return sanityRooms.map(room => toSanityBookingRoom(room))
  }

  return sortSanityFirst(
    resources.map(resource => {
      const sanityRoom = sanityById.get(resource.id)
      if (sanityRoom) return toSanityBookingRoom(sanityRoom)
      return {
        crescatRoomId: resource.id,
        title: resource.title,
        slug: null,
        summary: null,
        capacityStanding: null,
        capacitySeated: null,
        openingHours: null,
        image: null,
        source: "crescat",
        floor: null,
        suitedPurposes: [],
        bar: null,
        hasSound: false,
        soundDetails: null,
        hasLighting: false,
        lightingDetails: null,
        hasAV: false,
        avDetails: null,
      }
    }),
  )
}

// Put Sanity-enriched rooms first, Crescat-only rooms last. Preserve the
// original /resources order within each group via stable sort.
function sortSanityFirst(rooms: BookingRoom[]): BookingRoom[] {
  return rooms.toSorted((a, b) => {
    if (a.source === b.source) return 0
    return a.source === "sanity" ? -1 : 1
  })
}

type SanityBookableRoom = Awaited<ReturnType<typeof fetchBookableRooms>>[number]

function toSanityBookingRoom(room: SanityBookableRoom): BookingRoom {
  return {
    crescatRoomId: room.crescatRoomId,
    title: room.title,
    slug: room.slug,
    summary: room.summary,
    capacityStanding: room.capacityStanding,
    capacitySeated: room.capacitySeated,
    openingHours: room.openingHours ?? null,
    image: room.image
      ? { assetUrl: room.image.assetUrl, alt: room.image.alt }
      : null,
    source: "sanity",
    floor: room.floor,
    suitedPurposes: room.suitedPurposes,
    bar: room.bar,
    hasSound: room.hasSound,
    soundDetails: room.soundDetails,
    hasLighting: room.hasLighting,
    lightingDetails: room.lightingDetails,
    hasAV: room.hasAV,
    avDetails: room.avDetails,
  }
}
