export type PriceType = "ordinær" | "student" | "frivillig"

export type KaraokeBookingPayload = {
  eventName: string
  startDate: string
  startTime: string
  duration: number
  endTime: string
  description: string
  contactName: string
  contactEmail: string
  contactPhone: string
  priceType: PriceType
  numberOfPeople: number
  totalPrice: number
  studentProofAccepted: boolean
  acceptTerms: boolean
}

export interface KaraokeRoomImage {
  _key: string | null
  id: string | null
  alt: string | null
  caption: string | null
  hotspot: { x: number; y: number } | null
  crop: {
    top: number
    bottom: number
    left: number
    right: number
  } | null
  lqip: string | null
}

export interface KaraokeRoom {
  slug: string
  title: string
  summary: string | null
  capacitySeated: number | null
  capacityStanding: number | null
  images: KaraokeRoomImage[]
}
