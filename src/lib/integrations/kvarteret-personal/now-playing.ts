import "server-only"

export interface NowPlayingState {
    authorized: boolean
    hasTrack: boolean
    isPlaybackActive: boolean
    name: string | null
    artists: string | null
    album: string | null
    image: string | null
    progressMs: number | null
    durationMs: number | null
    progressPercent: number | null
    connectUrl: string
}

const PERSONAL_APP_BASE_URL =
    process.env.PERSONAL_APP_BASE_URL?.trim() || "https://personal.kvarteret.no"

function parseBoolean(value: unknown): boolean {
    return typeof value === "boolean" ? value : false
}

function parseString(value: unknown): string | null {
    return typeof value === "string" && value.trim() ? value : null
}

function parseNumber(value: unknown): number | null {
    return typeof value === "number" && Number.isFinite(value) ? value : null
}

function parseNowPlaying(payload: unknown): NowPlayingState {
    const value = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {}

    return {
        authorized: parseBoolean(value.authorized),
        hasTrack: parseBoolean(value.hasTrack),
        isPlaybackActive: parseBoolean(value.isPlaybackActive),
        name: parseString(value.name),
        artists: parseString(value.artists),
        album: parseString(value.album),
        image: parseString(value.image),
        progressMs: parseNumber(value.progressMs),
        durationMs: parseNumber(value.durationMs),
        progressPercent: parseNumber(value.progressPercent),
        connectUrl: parseString(value.connectUrl) ?? `${PERSONAL_APP_BASE_URL}/spotify/login`,
    }
}

export async function fetchNowPlaying(): Promise<NowPlayingState | null> {
    const response = await fetch(`${PERSONAL_APP_BASE_URL}/api/now-playing`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
    })

    if (!response.ok) return null
    return parseNowPlaying(await response.json())
}
