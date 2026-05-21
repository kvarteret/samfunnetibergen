import { TZDate } from "@date-fns/tz"
import ical, { ICalCalendarMethod } from "ical-generator"
import { createClient } from "next-sanity"

import { arrangementBySlugQuery } from "@/lib/sanity/queries/events"
import { apiVersion, dataset, projectId } from "@/sanity/env"

const client = createClient({ projectId, dataset, apiVersion, useCdn: true })

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://samfunnetibergen.no").trim()
const TZ = "Europe/Oslo"

function toDate(date: string): Date {
    const [year, month, day] = date.split("-").map(Number)
    return new Date(year, month - 1, day)
}

function toDateTime(date: string, time: string): Date {
    return new TZDate(`${date}T${time}:00`, TZ)
}

function nextDay(date: Date): Date {
    const d = new Date(date)
    d.setDate(d.getDate() + 1)
    return d
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const today = new Date().toISOString().slice(0, 10)
    const arrangement = await client.fetch(arrangementBySlugQuery, { slug, today })

    if (!arrangement) {
        return new Response("Not found", { status: 404 })
    }

    const calendar = ical({
        name: arrangement.title ?? "Samfunnet i Bergen",
        prodId: "//Samfunnet i Bergen//Arrangementer//NO",
        method: ICalCalendarMethod.PUBLISH,
        ttl: 3600,
    })

    const url = `${BASE_URL}/arrangementer/${slug}`
    const location = arrangement.room?.title ?? arrangement.roomText ?? "Samfunnet i Bergen"

    if (arrangement.isRecurring && arrangement.rrule && arrangement.dates?.length) {
        const base = arrangement.dates[0]
        const allDay = !base.startTime
        const start = allDay ? toDate(base.startDate) : toDateTime(base.startDate, base.startTime!)
        const end = allDay
            ? nextDay(toDate(base.startDate))
            : base.endTime
              ? toDateTime(base.startDate, base.endTime)
              : toDateTime(base.startDate, base.startTime!)

        calendar.createEvent({
            id: `${arrangement._id}@samfunnetibergen.no`,
            summary: arrangement.title,
            start,
            end,
            allDay,
            repeating: arrangement.rrule,
            location,
            url,
            organizer: arrangement.organizerGroup?.name
                ? { name: arrangement.organizerGroup.name, email: "post@samfunnetibergen.no" }
                : undefined,
        })
    } else {
        for (const d of arrangement.dates ?? []) {
            const allDay = !d.startTime
            const start = allDay ? toDate(d.startDate) : toDateTime(d.startDate, d.startTime!)
            const end = allDay
                ? nextDay(toDate(d.startDate))
                : d.endTime
                  ? toDateTime(d.startDate, d.endTime)
                  : toDateTime(d.startDate, d.startTime!)

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
            "Content-Disposition": `attachment; filename="${slug}.ics"`,
            "Cache-Control": "public, max-age=3600",
        },
    })
}
