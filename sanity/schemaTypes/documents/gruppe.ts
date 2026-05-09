import { UsersIcon } from "@sanity/icons"
import { orderRankField, orderRankOrdering } from "@sanity/orderable-document-list"
import { defineArrayMember, defineField, defineType } from "sanity"

export const GRUPPE_CATEGORIES = [
    { title: "Arbeidsgruppe", value: "arbeidsgruppe" },
    { title: "Komité", value: "komitee" },
    { title: "Fast samarbeidspartner (Dorg)", value: "dorg" },
    { title: "Brukerorganisasjon (Borg)", value: "borg" },
]

export type GruppeCategory = "arbeidsgruppe" | "komitee" | "dorg" | "borg"

export const gruppe = defineType({
    name: "studentGroup",
    title: "Gruppe",
    type: "document",
    icon: UsersIcon,
    fields: [
        defineField({
            name: "name",
            title: "Navn",
            type: "string",
            validation: rule => rule.required(),
        }),
        defineField({
            name: "slug",
            title: "Slug",
            type: "slug",
            options: { source: "name" },
            validation: rule => rule.required(),
        }),
        defineField({
            name: "category",
            title: "Kategori",
            type: "string",
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
            rows: 3,
            validation: rule => rule.required(),
        }),
        defineField({
            name: "body",
            title: "Fullstendig beskrivelse",
            type: "portableTextContent",
        }),
        defineField({
            name: "isRecruiting",
            title: "Rekrutterer",
            description: "Vis gruppen under /blifrivillig og på blifrivillig.no.",
            type: "boolean",
            initialValue: false,
        }),
        defineField({
            name: "recruitmentLabel",
            title: "Rekrutteringskategori",
            description: "Kort merkelapp som vises over gruppen på bli frivillig-siden.",
            type: "string",
            hidden: ({ document }) => document?.isRecruiting !== true,
        }),
        defineField({
            name: "recruitmentLead",
            title: "Rekrutteringsingress",
            description: "Kort tekst for valgkortet på bli frivillig-siden.",
            type: "text",
            rows: 4,
            hidden: ({ document }) => document?.isRecruiting !== true,
        }),
        defineField({
            name: "recruitmentSections",
            title: "Les litt mer",
            description: "Korte, lesbare seksjoner for bli frivillig-siden.",
            type: "array",
            hidden: ({ document }) => document?.isRecruiting !== true,
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
            validation: rule => rule.email(),
        }),
        defineField({
            name: "website",
            title: "Nettside",
            type: "url",
            validation: rule =>
                rule.uri({ scheme: ["http", "https"] }).error("Må være en gyldig URL"),
        }),
        defineField({
            name: "image",
            title: "Bilde",
            type: "sourcedImage",
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
                arbeidsgruppe: "Arbeidsgruppe",
                komitee: "Komité",
                dorg: "Fast samarbeidspartner",
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
