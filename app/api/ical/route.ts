import { TZDate } from "@date-fns/tz"
import ical, { ICalCalendarMethod } from "ical-generator"
import { createClient } from "next-sanity"

import { publishedArrangementsQuery } from "@/lib/sanity/queries/events"
import { apiVersion, dataset, projectId } from "@/sanity/env"

const client = createClient({ projectId, dataset, apiVersion, useCdn: false })

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://samfunnetibergen.no").trim()
const TZ = "Europe/Oslo"

function toDateTime(date: string, time?: string | null): Date {
    if (!time) {
        const [year, month, day] = date.split("-").map(Number)
        return new Date(year, month - 1, day)
    }
    return new TZDate(`${date}T${time}:00`, TZ)
}

export const dynamic = "force-dynamic"

export async function GET() {
    const today = new Date().toISOString().slice(0, 10)
    const arrangements = await client.fetch(publishedArrangementsQuery, { today })

    const calendar = ical({
        name: "Samfunnet i Bergen — Arrangementer",
        prodId: "//Samfunnet i Bergen//Arrangementer//NO",
        method: ICalCalendarMethod.PUBLISH,
        ttl: 3600,
    })

    for (const arrangement of arrangements) {
        const url = `${BASE_URL}/arrangementer/${arrangement.slug}`
        const location = arrangement.room?.title ?? arrangement.roomText ?? "Samfunnet i Bergen"

        for (const d of arrangement.dates ?? []) {
            const start = toDateTime(d.startDate, d.startTime)
            const end = d.endTime ? toDateTime(d.startDate, d.endTime) : start
            const allDay = !d.startTime

            calendar.createEvent({
                id: `${d._key}@samfunnetibergen.no`,
                summary: arrangement.title,
                start,
                end,
                allDay,
                location,
                url,
                organizer: arrangement.organizerGroup?.name
                    ? { name: arrangement.organizerGroup.name, email: "post@samfunnetibergen.no" }
                    : undefined,
            })
        }
    }

    return new Response(calendar.toString(), {
        headers: {
            "Content-Type": "text/calendar; charset=utf-8",
            "Content-Disposition": 'attachment; filename="samfunnet-arrangementer.ics"',
            "Cache-Control": "no-cache",
        },
    })
}
