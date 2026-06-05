import { ClockIcon } from "@sanity/icons"
import { defineArrayMember, defineField, defineType } from "sanity"

const weekdayLabels: Record<number, string> = {
    1: "Man",
    2: "Tir",
    3: "Ons",
    4: "Tor",
    5: "Fre",
    6: "Lør",
    7: "Søn",
}

function formatWeekdays(weekdays?: number[]) {
    const days = [...new Set(weekdays ?? [])].sort((a, b) => a - b)
    if (!days.length) return "Ukedager mangler"

    const isContiguous = days.every((day, index) => index === 0 || day === days[index - 1] + 1)
    if (isContiguous && days.length > 1) {
        return `${weekdayLabels[days[0]]}-${weekdayLabels[days[days.length - 1]]}`
    }

    return days.map(day => weekdayLabels[day]).join(", ")
}

export const openingHoursRow = defineType({
    name: "openingHoursRow",
    title: "Åpningstidsrad",
    type: "object",
    fields: [
        defineField({
            name: "weekdays",
            title: "Ukedager",
            description: "ISO: 1=man, 2=tir, 3=ons, 4=tor, 5=fre, 6=lør, 7=søn",
            type: "array",
            of: [defineArrayMember({ type: "number" })],
            validation: rule =>
                rule.custom((weekdays, context) => {
                    const parent = context.parent as
                        | { closed?: boolean; status?: string }
                        | undefined
                    if (parent?.status === "closed" || parent?.closed === true) return true
                    return weekdays?.length ? true : "Velg minst én ukedag"
                }),
            options: {
                list: [
                    { title: "Mandag", value: 1 },
                    { title: "Tirsdag", value: 2 },
                    { title: "Onsdag", value: 3 },
                    { title: "Torsdag", value: 4 },
                    { title: "Fredag", value: 5 },
                    { title: "Lørdag", value: 6 },
                    { title: "Søndag", value: 7 },
                ],
            },
        }),
        defineField({
            name: "status",
            title: "Status",
            type: "string",
            initialValue: "open",
            options: {
                list: [
                    { title: "Åpen", value: "open" },
                    { title: "Stengt", value: "closed" },
                ],
                layout: "radio",
            },
        }),
        defineField({
            name: "duration",
            title: "Tid",
            type: "duration",
            hidden: ({ parent }) => parent?.status === "closed" || parent?.closed === true,
            validation: rule =>
                rule.custom((duration, context) => {
                    const parent = context.parent as
                        | { closed?: boolean; status?: string }
                        | undefined
                    const value = duration as { start?: string; end?: string } | undefined
                    if (
                        parent?.status === "closed" ||
                        parent?.closed === true ||
                        (value?.start && value?.end)
                    ) {
                        return true
                    }
                    return "Velg tidspunkt eller marker raden som stengt"
                }),
        }),
        defineField({
            name: "note",
            title: "Merknad",
            type: "text",
            rows: 2,
        }),
    ],
    preview: {
        select: {
            weekdays: "weekdays",
            status: "status",
            closed: "closed",
            start: "duration.start",
            end: "duration.end",
            note: "note",
        },
        prepare({ weekdays, status, closed, start, end, note }) {
            const label = formatWeekdays(weekdays)
            const time =
                status === "closed" || closed === true ? "Stengt" : `${start ?? "?"}-${end ?? "?"}`
            return {
                title: `${label}: ${time}`,
                subtitle: note,
            }
        },
    },
})

export const openingHours = defineType({
    name: "openingHours",
    title: "Åpningstider",
    type: "object",
    icon: ClockIcon,
    fields: [
        defineField({
            name: "rows",
            title: "Rader",
            type: "array",
            of: [defineArrayMember({ type: "openingHoursRow" })],
        }),
    ],
    preview: {
        select: { rows: "rows" },
        prepare({ rows }) {
            const count = rows?.length ?? 0
            return { title: "Åpningstider", subtitle: `${count} rader` }
        },
    },
})
