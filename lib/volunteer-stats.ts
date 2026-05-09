import "server-only"

const PERSONAL_API_BASE =
    process.env.PERSONAL_APP_BASE_URL?.trim() ?? "https://personal.kvarteret.no"

export type VolunteerStats = {
    totalVolunteers: number
    currentSemesterVolunteers: number
}

export async function fetchVolunteerStats(): Promise<VolunteerStats | null> {
    try {
        const res = await fetch(`${PERSONAL_API_BASE}/api/v1/stats`, {
            next: { revalidate: 3600 },
        })
        if (!res.ok) return null
        return res.json() as Promise<VolunteerStats>
    } catch {
        return null
    }
}
