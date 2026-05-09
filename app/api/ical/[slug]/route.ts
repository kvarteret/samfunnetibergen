import { createClient } from "next-sanity"

import { apiVersion, dataset, projectId } from "@/sanity/env"
import { arrangementBySlugQuery } from "@/lib/sanity/query-definitions"

const client = createClient({ projectId, dataset, apiVersion, useCdn: true })

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://samfunnetibergen.no"

function icalDate(date: string, time?: string | null): string {
    const d = date.replace(/-/g, "")
    if (!time) return `${d}`
    const t = time.replace(":", "") + "00"
    return `${d}T${t}`
}

function escapeIcal(value: string): string {
    return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n")
}

function foldLine(line: string): string {
    const chunks: string[] = []
    while (line.length > 75) {
        chunks.push(line.slice(0, 75))
        line = " " + line.slice(75)
    }
    chunks.push(line)
    return chunks.join("\r\n")
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params

    const today = new Date().toISOString().slice(0, 10)
    const arrangement = await client.fetch(arrangementBySlugQuery, { slug, today })

    if (!arrangement) {
        return new Response("Not found", { status: 404 })
    }

    const location = arrangement.room?.title ?? arrangement.roomText ?? "Samfunnet i Bergen"
    const url = `${BASE_URL}/arrangementer/${slug}`

    const events = (arrangement.dates ?? [])
        .map(d => {
            const dtstart = icalDate(d.startDate, d.startTime)
            const dtend = d.endTime ? icalDate(d.startDate, d.endTime) : dtstart

            const hasTime = Boolean(d.startTime)
            const datePrefix = hasTime ? "TZID=Europe/Oslo:" : "VALUE=DATE:"

            const lines = [
                "BEGIN:VEVENT",
                foldLine(`DTSTART;${datePrefix}${dtstart}`),
                foldLine(`DTEND;${datePrefix}${dtend}`),
                foldLine(`SUMMARY:${escapeIcal(arrangement.title ?? "")}`),
                foldLine(`LOCATION:${escapeIcal(location)}`),
                foldLine(`URL:${url}`),
                `UID:${d._key}@samfunnetibergen.no`,
                "END:VEVENT",
            ]

            return lines.join("\r\n")
        })
        .join("\r\n")

    const calendar = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Samfunnet i Bergen//Arrangementer//NO",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        events,
        "END:VCALENDAR",
    ].join("\r\n")

    return new Response(calendar, {
        headers: {
            "Content-Type": "text/calendar; charset=utf-8",
            "Content-Disposition": `attachment; filename="${slug}.ics"`,
            "Cache-Control": "public, max-age=3600",
        },
    })
}
