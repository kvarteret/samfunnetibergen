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
