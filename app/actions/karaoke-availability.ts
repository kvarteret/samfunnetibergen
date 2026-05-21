"use server"

const CRESCAT_URL =
    "https://app.crescat.io/venue-access/studentersamfunnet-i-bergen-bookinkalender-karaoke/calendar"

export interface CresatBooking {
    id: number
    resourceId: number
    event_id: number
    start: string
    end: string
    color: string
    title: string
    part_of_event: boolean
}

export async function fetchKaraokeAvailability(
    start: string,
    end: string,
): Promise<CresatBooking[]> {
    try {
        const url = `${CRESCAT_URL}?start=${start}&end=${end}`
        const res = await fetch(url, { next: { revalidate: 300 } })
        if (!res.ok) return []
        return (await res.json()) as CresatBooking[]
    } catch {
        return []
    }
}
