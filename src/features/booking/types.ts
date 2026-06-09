import type { OpeningHours } from "@/lib/opening-hours"

export interface BookingRoomImage {
  assetUrl: string | null
  alt: string | null
}

export interface BookingRoom {
  title: string | null
  slug: string
  summary: string | null
  capacityStanding: number | null
  capacitySeated: number | null
  crescatRoomId: number
  openingHours: OpeningHours | null
  image: BookingRoomImage | null
}
