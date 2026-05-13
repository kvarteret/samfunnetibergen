import { UsersIcon } from "@sanity/icons"
import { orderRankField, orderRankOrdering } from "@sanity/orderable-document-list"
import { defineArrayMember, defineField, defineType } from "sanity"

export const GRUPPE_CATEGORIES = [
    { title: "Arbeidsgruppe (Arg)", value: "arbeidsgruppe" },
    { title: "Komité (Arg)", value: "komitee" },
    { title: "Driftsorganisasjon (Dorg)", value: "dorg" },
    { title: "Brukerorganisasjon (Borg)", value: "borg" },
]

export type GruppeCategory = "arbeidsgruppe" | "komitee" | "dorg" | "borg"

export const gruppe = defineType({
    name: "studentGroup",
    title: "Gruppe",
    type: "document",
    icon: UsersIcon,
    groups: [
        { name: "identity", title: "Gruppe", default: true },
        { name: "hierarchy", title: "Hierarki" },
        { name: "recruitment", title: "Rekruttering" },
        { name: "contact", title: "Kontakt" },
    ],
    fields: [
        defineField({
            name: "name",
            title: "Navn",
            type: "string",
            group: "identity",
            validation: rule => rule.required(),
        }),
        defineField({
            name: "slug",
            title: "Slug",
            type: "slug",
            group: "identity",
            options: { source: "name" },
            validation: rule => rule.required(),
        }),
        defineField({
            name: "category",
            title: "Kategori",
            type: "string",
            group: "identity",
            options: {
                list: GRUPPE_CATEGORIES,
                layout: "radio",
            },
            validation: rule => rule.required(),
        }),
        defineField({
            name: "parentGroup",
            title: "Overordnet gruppe",
            description: "Dersom denne gruppen er en undergruppe, velg foreldregruppen her",
            type: "reference",
            group: "hierarchy",
            to: [{ type: "studentGroup" }],
            options: {
                filter: "category in ['arbeidsgruppe', 'komitee'] && _id != $id",
                filterParams: { id: "" },
            },
        }),
        defineField({
            name: "summary",
            title: "Kort beskrivelse",
            type: "text",
            group: "identity",
            rows: 3,
            validation: rule => rule.required(),
        }),
        defineField({
            name: "body",
            title: "Fullstendig beskrivelse",
            type: "portableTextContent",
            group: "identity",
        }),
        defineField({
            name: "recruitmentLabel",
            title: "Rekrutteringskategori",
            description:
                "Kort merkelapp som kan brukes av bli frivillig-siden og andre rekrutteringsflater.",
            type: "string",
            group: "recruitment",
        }),
        defineField({
            name: "recruitmentLead",
            title: "Rekrutteringsingress",
            description:
                "Kort tekst for valgkort eller andre rekrutteringsflater. La stå tom for å bruke kort beskrivelse.",
            type: "text",
            rows: 4,
            group: "recruitment",
        }),
        defineField({
            name: "recruitmentSections",
            title: "Les litt mer",
            description:
                "Korte, lesbare seksjoner for rekruttering. Undergrupper skal opprettes som egne grupper med overordnet gruppe.",
            type: "array",
            group: "recruitment",
            of: [
                defineArrayMember({
                    name: "recruitmentSection",
                    type: "object",
                    fields: [
                        defineField({
                            name: "title",
                            title: "Tittel",
                            type: "string",
                            validation: rule => rule.required(),
                        }),
                        defineField({
                            name: "paragraphs",
                            title: "Avsnitt",
                            type: "array",
                            of: [defineArrayMember({ type: "text", rows: 3 })],
                            validation: rule => rule.required().min(1),
                        }),
                    ],
                    preview: { select: { title: "title" } },
                }),
            ],
        }),
        defineField({
            name: "email",
            title: "E-post",
            type: "string",
            group: "contact",
            validation: rule => rule.email(),
        }),
        defineField({
            name: "website",
            title: "Nettside",
            type: "url",
            group: "contact",
            validation: rule =>
                rule.uri({ scheme: ["http", "https"] }).error("Må være en gyldig URL"),
        }),
        defineField({
            name: "image",
            title: "Bilde",
            type: "sourcedImage",
            group: "identity",
        }),
        orderRankField({ type: "studentGroup" }),
    ],
    orderings: [orderRankOrdering],
    preview: {
        select: {
            title: "name",
            subtitle: "category",
            media: "image.image",
        },
        prepare({ title, subtitle, media }) {
            const categoryLabel: Record<string, string> = {
                arbeidsgruppe: "Arbeidsgruppe (Arg)",
                komitee: "Komité (Arg)",
                dorg: "Driftsorganisasjon (Dorg)",
                borg: "Brukerorganisasjon",
            }
            return {
                title: title ?? "Gruppe",
                subtitle: categoryLabel[subtitle] ?? subtitle,
                media,
            }
        },
    },
})
