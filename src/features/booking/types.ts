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
    image: BookingRoomImage | null
}
