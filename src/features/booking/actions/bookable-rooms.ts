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

  return resources.map(resource => {
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
    }
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
  }
}
