import { UsersIcon } from "@sanity/icons"
import { orderRankField, orderRankOrdering } from "@sanity/orderable-document-list"
import { defineArrayMember, defineField, defineType } from "sanity"

const groupSection = defineType({
    name: "groupSection",
    title: "Seksjon",
    type: "object",
    fields: [
        defineField({
            name: "titleNb",
            title: "Tittel",
            type: "string",
            validation: rule => rule.required(),
        }),
        defineField({
            name: "paragraphsNb",
            title: "Avsnitt",
            type: "array",
            of: [defineArrayMember({ type: "text", rows: 3 })],
            validation: rule => rule.required().min(1),
        }),
        defineField({
            name: "titleEn",
            title: "Title",
            type: "string",
            validation: rule => rule.required(),
        }),
        defineField({
            name: "paragraphsEn",
            title: "Paragraphs",
            type: "array",
            of: [defineArrayMember({ type: "text", rows: 3 })],
            validation: rule => rule.required().min(1),
        }),
    ],
    preview: {
        select: { title: "titleNb", subtitle: "titleEn" },
        prepare({ title, subtitle }) {
            return {
                title: title ?? subtitle ?? "Seksjon",
                subtitle: subtitle && subtitle !== title ? subtitle : undefined,
            }
        },
    },
})

export const launchGroup = defineType({
    name: "launchGroup",
    title: "Frivilliggruppe",
    type: "document",
    icon: UsersIcon,
    groups: [
        { name: "nb", title: "Norsk", default: true },
        { name: "en", title: "Engelsk" },
        { name: "media", title: "Bilde" },
        { name: "sections", title: "Seksjoner" },
    ],
    fields: [
        defineField({
            name: "slug",
            title: "Slug",
            type: "string",
            group: "nb",
            validation: rule => rule.required(),
        }),
        defineField({
            name: "nameNb",
            title: "Navn",
            type: "string",
            group: "nb",
            validation: rule => rule.required(),
        }),
        defineField({
            name: "eyebrowNb",
            title: "Kort merkelapp",
            type: "string",
            group: "nb",
        }),
        defineField({
            name: "leadNb",
            title: "Ingress",
            type: "text",
            rows: 4,
            group: "nb",
            validation: rule => rule.required(),
        }),
        defineField({
            name: "nameEn",
            title: "Name",
            type: "string",
            group: "en",
            validation: rule => rule.required(),
        }),
        defineField({
            name: "eyebrowEn",
            title: "Short label",
            type: "string",
            group: "en",
        }),
        defineField({
            name: "leadEn",
            title: "Lead",
            type: "text",
            rows: 4,
            group: "en",
            validation: rule => rule.required(),
        }),
        defineField({
            name: "image",
            title: "Bilde",
            type: "image",
            group: "media",
            options: { hotspot: true },
        }),
        defineField({
            name: "accordionSections",
            title: "Korte seksjoner",
            type: "array",
            group: "sections",
            of: [defineArrayMember({ type: "groupSection" })],
        }),
        defineField({
            name: "detailSections",
            title: "Detaljerte seksjoner",
            type: "array",
            group: "sections",
            of: [defineArrayMember({ type: "groupSection" })],
        }),
        defineField({
            name: "order",
            title: "Gammel sortering",
            type: "number",
            hidden: true,
            readOnly: true,
            deprecated: { reason: "Bruk dra-og-slipp-sortering i Studio." },
        }),
        orderRankField({ type: "launchGroup" }),
    ],
    orderings: [orderRankOrdering],
    preview: {
        select: { title: "nameNb", subtitle: "slug", media: "image" },
    },
})

export const volunteerGroupSummary = defineType({
    name: "volunteerGroupSummary",
    title: "Frivilliggruppe-kort",
    type: "document",
    icon: UsersIcon,
    groups: [
        { name: "nb", title: "Norsk", default: true },
        { name: "en", title: "Engelsk" },
    ],
    fields: [
        defineField({
            name: "name",
            title: "Navn",
            type: "string",
            validation: rule => rule.required(),
        }),
        defineField({
            name: "descriptionNb",
            title: "Beskrivelse",
            type: "text",
            rows: 4,
            group: "nb",
            validation: rule => rule.required(),
        }),
        defineField({
            name: "descriptionEn",
            title: "Description",
            type: "text",
            rows: 4,
            group: "en",
            validation: rule => rule.required(),
        }),
        defineField({
            name: "order",
            title: "Gammel sortering",
            type: "number",
            hidden: true,
            readOnly: true,
            deprecated: { reason: "Bruk dra-og-slipp-sortering i Studio." },
        }),
        orderRankField({ type: "volunteerGroupSummary" }),
    ],
    orderings: [orderRankOrdering],
    preview: {
        select: { title: "name" },
    },
})

export const groupSectionSchema = groupSection
