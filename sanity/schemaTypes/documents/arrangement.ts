import { CalendarIcon } from "@sanity/icons"
import { defineArrayMember, defineField, defineType } from "sanity"

const APPROVAL_STATUS_OPTIONS = [
    { title: "Venter på godkjenning", value: "pending" },
    { title: "Godkjent", value: "approved" },
    { title: "Avvist", value: "rejected" },
    { title: "Arkivert", value: "archived" },
]

export const arrangement = defineType({
    name: "arrangement",
    title: "Arrangement",
    type: "document",
    icon: CalendarIcon,
    groups: [
        { name: "core", title: "Grunninfo", default: true },
        { name: "dates", title: "Datoer" },
        { name: "location", title: "Sted" },
        { name: "pricing", title: "Pris" },
        { name: "organizer", title: "Arrangør" },
        { name: "links", title: "Lenker" },
        { name: "media", title: "Bilde" },
        { name: "admin", title: "Administrasjon" },
    ],
    fields: [
        // ─── Core info ─────────────────────────────────────────────
        defineField({
            name: "title",
            title: "Tittel",
            type: "string",
            group: "core",
            validation: rule => rule.required(),
        }),
        defineField({
            name: "slug",
            title: "Slug",
            type: "slug",
            group: "core",
            options: { source: "title" },
            validation: rule => rule.required(),
        }),
        defineField({
            name: "eventType",
            title: "Arrangementtype",
            type: "reference",
            to: [{ type: "eventType" }],
            group: "core",
        }),
        defineField({
            name: "description",
            title: "Beskrivelse",
            description: "Rik tekst — formatering, bilder og lenker støttes",
            type: "portableTextContent",
            group: "core",
        }),
        defineField({
            name: "language",
            title: "Språk",
            type: "string",
            group: "core",
            initialValue: "nb",
            options: {
                list: [
                    { title: "Norsk", value: "nb" },
                    { title: "Engelsk", value: "en" },
                ],
                layout: "radio",
                direction: "horizontal",
            },
        }),

        // ─── Dates ─────────────────────────────────────────────────
        defineField({
            name: "dates",
            title: "Datoer",
            description: "Legg til én eller flere datoer for arrangementet",
            type: "array",
            group: "dates",
            of: [defineArrayMember({ type: "arrangementDate" })],
            validation: rule => rule.required().min(1).error("Minst én dato er påkrevd"),
        }),
        defineField({
            name: "isRecurring",
            title: "Gjentagende arrangement",
            description: "Slå på for å angi et gjentagelsesmønster",
            type: "boolean",
            group: "dates",
            initialValue: false,
        }),
        defineField({
            name: "rrule",
            title: "Gjentagelsesregel (iCal RRULE)",
            description:
                "Automatisk generert fra gjentagelsesbyggeren i skjemaet. Format: FREQ=WEEKLY;BYDAY=MO,WE",
            type: "string",
            group: "dates",
            hidden: ({ document }) => !document?.isRecurring,
        }),

        // ─── Media ─────────────────────────────────────────────────
        defineField({
            name: "image",
            title: "Bilde",
            type: "image",
            group: "media",
            options: { hotspot: true },
        }),
        defineField({
            name: "imageCaption",
            title: "Bildetekst",
            type: "string",
            group: "media",
        }),

        // ─── Location ──────────────────────────────────────────────
        defineField({
            name: "room",
            title: "Rom",
            description: "Velg et rom fra listen, eller bruk fritekst nedenfor",
            type: "reference",
            to: [{ type: "room" }],
            group: "location",
        }),
        defineField({
            name: "roomText",
            title: "Sted (fritekst)",
            description: "Brukes om stedet ikke er et registrert rom — f.eks. 'Uteområdet'",
            type: "string",
            group: "location",
        }),

        // ─── Organizer ─────────────────────────────────────────────
        defineField({
            name: "organizerGroup",
            title: "Arrangørgruppe",
            description: "Velg en gruppe fra lista, om arrangøren er registrert der",
            type: "reference",
            to: [{ type: "studentGroup" }],
            group: "organizer",
        }),
        defineField({
            name: "organizerText",
            title: "Arrangør (fritekst)",
            description: "Brukes om arrangøren ikke er i lista",
            type: "string",
            group: "organizer",
        }),

        // ─── Pricing ───────────────────────────────────────────────
        defineField({
            name: "isFree",
            title: "Gratis inngang",
            type: "boolean",
            group: "pricing",
            initialValue: false,
        }),
        defineField({
            name: "priceOrdinar",
            title: "Pris — Ordinær (kr)",
            type: "number",
            group: "pricing",
            hidden: ({ document }) => Boolean(document?.isFree),
            validation: rule => rule.min(0),
        }),
        defineField({
            name: "priceStudent",
            title: "Pris — Student (kr)",
            type: "number",
            group: "pricing",
            hidden: ({ document }) => Boolean(document?.isFree),
            validation: rule => rule.min(0),
        }),
        defineField({
            name: "priceMedlem",
            title: "Pris — Medlem (kr)",
            type: "number",
            group: "pricing",
            hidden: ({ document }) => Boolean(document?.isFree),
            validation: rule => rule.min(0),
        }),

        // ─── Links ─────────────────────────────────────────────────
        defineField({
            name: "ticketUrl",
            title: "Billettlenke",
            type: "url",
            group: "links",
            validation: rule => rule.uri({ scheme: ["http", "https"] }),
        }),
        defineField({
            name: "facebookUrl",
            title: "Facebook-arrangement",
            type: "url",
            group: "links",
            validation: rule => rule.uri({ scheme: ["http", "https"] }),
        }),

        // ─── Admin / approval ──────────────────────────────────────
        defineField({
            name: "approvalStatus",
            title: "Godkjenningsstatus",
            type: "string",
            group: "admin",
            initialValue: "pending",
            options: {
                list: APPROVAL_STATUS_OPTIONS,
                layout: "radio",
            },
        }),
        defineField({
            name: "submittedBy",
            title: "Innsendt av (navn)",
            type: "string",
            group: "admin",
        }),
        defineField({
            name: "submittedByEmail",
            title: "Innsendt av (e-post)",
            type: "string",
            group: "admin",
        }),
        defineField({
            name: "submittedByOrganization",
            title: "Organisasjon",
            type: "string",
            group: "admin",
        }),
        defineField({
            name: "adminNote",
            title: "Intern kommentar",
            description: "Kun synlig for redaktører",
            type: "text",
            rows: 2,
            group: "admin",
        }),
    ],
    preview: {
        select: {
            title: "title",
            status: "approvalStatus",
            startDate: "dates.0.startDate",
            image: "image",
        },
        prepare({ title, status, startDate, image }) {
            const statusLabel: Record<string, string> = {
                pending: "⏳ Venter",
                approved: "✅ Godkjent",
                rejected: "❌ Avvist",
                archived: "📦 Arkivert",
            }
            return {
                title: title ?? "Arrangement",
                subtitle: [startDate, statusLabel[status]].filter(Boolean).join(" · "),
                media: image,
            }
        },
    },
    orderings: [
        {
            title: "Dato (nyeste først)",
            name: "dateDesc",
            by: [{ field: "dates.0.startDate", direction: "desc" }],
        },
        {
            title: "Dato (eldste først)",
            name: "dateAsc",
            by: [{ field: "dates.0.startDate", direction: "asc" }],
        },
    ],
})
