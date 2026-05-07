import { ClockIcon } from "@sanity/icons"
import { defineArrayMember, defineField, defineType } from "sanity"

const dayEntry = defineType({
    name: "openingHoursDay",
    title: "Åpningstid",
    type: "object",
    fields: [
        defineField({
            name: "day",
            title: "Dag",
            type: "string",
            options: {
                list: [
                    { title: "Mandag", value: "monday" },
                    { title: "Tirsdag", value: "tuesday" },
                    { title: "Onsdag", value: "wednesday" },
                    { title: "Torsdag", value: "thursday" },
                    { title: "Fredag", value: "friday" },
                    { title: "Lørdag", value: "saturday" },
                    { title: "Søndag", value: "sunday" },
                ],
                layout: "dropdown",
            },
            validation: rule => rule.required(),
        }),
        defineField({
            name: "opens",
            title: "Åpner",
            type: "string",
            placeholder: "16:00",
        }),
        defineField({
            name: "closes",
            title: "Stenger",
            type: "string",
            placeholder: "02:00",
        }),
        defineField({
            name: "closed",
            title: "Stengt denne dagen",
            type: "boolean",
            initialValue: false,
        }),
    ],
    preview: {
        select: { day: "day", opens: "opens", closes: "closes", closed: "closed" },
        prepare({ day, opens, closes, closed }) {
            const dayLabel: Record<string, string> = {
                monday: "Man",
                tuesday: "Tir",
                wednesday: "Ons",
                thursday: "Tor",
                friday: "Fre",
                saturday: "Lør",
                sunday: "Søn",
            }
            const label = dayLabel[day] ?? day
            const hours = closed ? "Stengt" : `${opens ?? "?"} – ${closes ?? "?"}`
            return { title: `${label}: ${hours}` }
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
            name: "note",
            title: "Merknad",
            description: "Vises over timeplanen, f.eks. «Åpningstider varierer etter program»",
            type: "string",
        }),
        defineField({
            name: "hours",
            title: "Dager",
            type: "array",
            of: [defineArrayMember({ type: "openingHoursDay" })],
        }),
    ],
    preview: {
        select: { note: "note", hours: "hours" },
        prepare({ note, hours }) {
            const count = hours?.length ?? 0
            return { title: note ?? "Åpningstider", subtitle: `${count} dager` }
        },
    },
})

export const openingHoursDaySchema = dayEntry
