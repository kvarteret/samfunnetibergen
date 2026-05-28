import { TZDate } from "@date-fns/tz"
import ical, { ICalCalendarMethod } from "ical-generator"
import { createClient } from "next-sanity"

import { publishedEventsQuery } from "@/lib/sanity/queries/events"
import { apiVersion, dataset, projectId } from "@/sanity/env"

const client = createClient({ projectId, dataset, apiVersion, useCdn: false })

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

export const dynamic = "force-dynamic"

export async function GET() {
    const today = new Date().toISOString().slice(0, 10)
    const events = await client.fetch(publishedEventsQuery, { today })

    const calendar = ical({
        name: "Samfunnet i Bergen",
        description: "Arrangementer på Samfunnet i Bergen",
        prodId: "//Samfunnet i Bergen//Arrangementer//NO",
        method: ICalCalendarMethod.PUBLISH,
        timezone: TZ,
        ttl: 3600,
    })

    for (const event of events) {
        const url = `${BASE_URL}/arrangementer/${event.slug}`
        const location = event.room?.title ?? event.roomText ?? "Samfunnet i Bergen"

        if (event.isRecurring && event.rrule && event.dates?.length) {
            const base = event.dates[0]
            const allDay = !base.startTime
            const start = allDay
                ? toDate(base.startDate)
                : toDateTime(base.startDate, base.startTime!)
            const end = allDay
                ? nextDay(toDate(base.startDate))
                : base.endTime
                  ? toDateTime(base.startDate, base.endTime)
                  : toDateTime(base.startDate, base.startTime!)

            calendar.createEvent({
                id: `${event._id}@samfunnetibergen.no`,
                summary: event.title,
                start,
                end,
                allDay,
                repeating: event.rrule,
                location,
                url,
                organizer: event.organizerGroup?.name
                    ? { name: event.organizerGroup.name, email: "post@samfunnetibergen.no" }
                    : undefined,
            })
        } else {
            for (const d of event.dates ?? []) {
                const allDay = !d.startTime
                const start = allDay ? toDate(d.startDate) : toDateTime(d.startDate, d.startTime!)
                const end = allDay
                    ? nextDay(toDate(d.startDate))
                    : d.endTime
                      ? toDateTime(d.startDate, d.endTime)
                      : toDateTime(d.startDate, d.startTime!)

                calendar.createEvent({
                    id: `${d._key}@samfunnetibergen.no`,
                    summary: event.title,
                    start,
                    end,
                    allDay,
                    location,
                    url,
                    organizer: event.organizerGroup?.name
                        ? {
                              name: event.organizerGroup.name,
                              email: "post@samfunnetibergen.no",
                          }
                        : undefined,
                })
            }
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
