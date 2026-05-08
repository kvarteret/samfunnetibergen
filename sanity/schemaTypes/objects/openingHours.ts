import { ClockIcon } from "@sanity/icons"
import { defineArrayMember, defineField, defineType } from "sanity"

export const openingHoursRow = defineType({
    name: "openingHoursRow",
    title: "Åpningstidsrad",
    type: "object",
    fields: [
        defineField({
            name: "label",
            title: "Dag(er)",
            description: "F.eks. «Mandag-torsdag», «Fredag» eller «Lørdag-søndag»",
            type: "string",
            validation: rule => rule.required(),
        }),
        defineField({
            name: "closed",
            title: "Stengt",
            type: "boolean",
            initialValue: false,
        }),
        defineField({
            name: "duration",
            title: "Tid",
            type: "duration",
            hidden: ({ parent }) => Boolean(parent?.closed),
            validation: rule =>
                rule.custom((duration, context) => {
                    const parent = context.parent as { closed?: boolean } | undefined
                    const value = duration as { start?: string; end?: string } | undefined
                    if (parent?.closed || (value?.start && value?.end)) {
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
            label: "label",
            closed: "closed",
            start: "duration.start",
            end: "duration.end",
            note: "note",
        },
        prepare({ label, closed, start, end, note }) {
            const time = closed ? "Stengt" : `${start ?? "?"}-${end ?? "?"}`
            return {
                title: label ? `${label}: ${time}` : time,
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
