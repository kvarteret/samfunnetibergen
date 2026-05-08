import { ComponentIcon } from "@sanity/icons"
import { orderRankField } from "@sanity/orderable-document-list"
import { defineArrayMember, defineField, defineType } from "sanity"

export const room = defineType({
    name: "room",
    title: "Rom",
    type: "document",
    icon: ComponentIcon,
    groups: [
        { name: "info", title: "Info", default: true },
        { name: "menu", title: "Meny" },
        { name: "specs", title: "Tekniske specs" },
        { name: "hours", title: "Åpningstid" },
        { name: "media", title: "Bilder" },
    ],
    fields: [
        // — Core info —
        defineField({
            name: "title",
            title: "Navn",
            type: "string",
            group: "info",
            validation: rule => rule.required(),
        }),
        defineField({
            name: "slug",
            title: "Slug",
            type: "slug",
            group: "info",
            options: { source: "title" },
            validation: rule => rule.required(),
        }),
        defineField({
            name: "summary",
            title: "Kort beskrivelse",
            type: "text",
            rows: 3,
            group: "info",
            validation: rule => rule.required(),
        }),
        defineField({
            name: "body",
            title: "Fullstendig beskrivelse",
            description: "Utdypende tekst om rommet",
            type: "portableTextContent",
            group: "info",
        }),
        defineField({
            name: "menu",
            title: "Meny",
            description: "Menyen som serveres i dette rommet / baren",
            type: "menu",
            group: "menu",
        }),
        orderRankField({ type: "room" }),

        // — Tech specs —
        defineField({
            name: "floor",
            title: "Etasje",
            type: "number",
            group: "specs",
        }),
        defineField({
            name: "capacityStanding",
            title: "Stående kapasitet",
            description: "Antall stående gjester (branntillatelse)",
            type: "number",
            group: "specs",
        }),
        defineField({
            name: "capacitySeated",
            title: "Sittende kapasitet",
            type: "number",
            group: "specs",
        }),
        defineField({
            name: "suitedPurposes",
            title: "Passer til",
            description: "Bruksområder, f.eks. Foredrag, fest, debatt",
            type: "array",
            group: "specs",
            of: [defineArrayMember({ type: "string" })],
            options: {
                layout: "tags",
            },
        }),
        defineField({
            name: "bar",
            title: "Bar",
            description: "Navn på baren i rommet, eller tomt om det ikke er bar",
            type: "string",
            group: "specs",
        }),
        defineField({
            name: "hasSound",
            title: "Lyd",
            type: "boolean",
            initialValue: false,
            group: "specs",
        }),
        defineField({
            name: "hasLighting",
            title: "Lys",
            type: "boolean",
            initialValue: false,
            group: "specs",
        }),
        defineField({
            name: "hasAV",
            title: "A/V",
            type: "boolean",
            initialValue: false,
            group: "specs",
        }),
        defineField({
            name: "specsUrl",
            title: "Tekniske spesifikasjoner (lenke)",
            description: "URL til PDF eller dokument med tekniske spesifikasjoner",
            type: "url",
            group: "specs",
            validation: rule => rule.uri({ scheme: ["http", "https"] }),
        }),

        // — Opening hours —
        defineField({
            name: "openingHours",
            title: "Åpningstider",
            type: "openingHours",
            group: "hours",
        }),

        // — Media —
        defineField({
            name: "images",
            title: "Bilder",
            type: "array",
            group: "media",
            of: [defineArrayMember({ type: "sourcedImage" })],
        }),
    ],
    preview: {
        select: {
            title: "title",
            standing: "capacityStanding",
            seated: "capacitySeated",
            media: "images.0.image",
        },
        prepare({ title, standing, seated, media }) {
            const cap =
                standing || seated
                    ? `${standing ?? "?"} stående / ${seated ?? "?"} sittende`
                    : undefined
            return { title: title ?? "Rom", subtitle: cap, media }
        },
    },
})
