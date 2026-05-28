export type FetchOptions = {
    stega?: boolean
}

export function getOsloDateString(): string {
    return new Intl.DateTimeFormat("en-CA", {
        day: "2-digit",
        month: "2-digit",
        timeZone: "Europe/Oslo",
        year: "numeric",
    }).format(new Date())
}
