export interface KaraokeRoomImage {
    _key: string | null
    assetUrl: string | null
    alt: string | null
    caption: string | null
}

export interface KaraokeRoom {
    slug: string
    title: string
    summary: string | null
    capacitySeated: number | null
    capacityStanding: number | null
    images: KaraokeRoomImage[]
}
