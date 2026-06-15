import type { OpeningHours } from "@/lib/opening-hours"

export interface BookingRoomImage {
  assetUrl: string | null
  alt: string | null
}

// A room offered in the booking picker. The list is autofetched from Crescat's
// /resources for the form's calendar and merged with Sanity content by
// crescatRoomId. `source` distinguishes a Sanity-enriched room (full card) from
// a Crescat-only room (minimal card, name only, house hours apply). Crescat-only
// rooms have no Sanity slug.
export interface BookingRoom {
  crescatRoomId: number
  title: string | null
  slug: string | null
  summary: string | null
  capacityStanding: number | null
  capacitySeated: number | null
  openingHours: OpeningHours | null
  image: BookingRoomImage | null
  source: "sanity" | "crescat"
}

// The plan refers to this merged shape as MergedBookableRoom; it is the same
// shape the picker consumes.
export type MergedBookableRoom = BookingRoom
