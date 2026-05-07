import { ComponentIcon } from "@sanity/icons"
import { orderRankField, orderRankOrdering } from "@sanity/orderable-document-list"
import { defineField, defineType } from "sanity"

export const homeBar = defineType({
    name: "homeBar",
    title: "Forsidebar",
    type: "document",
    icon: ComponentIcon,
    groups: [
        { name: "nb", title: "Norsk", default: true },
        { name: "en", title: "Engelsk" },
        { name: "media", title: "Bilde" },
    ],
    fields: [
        defineField({
            name: "nameNb",
            title: "Navn",
            type: "string",
            group: "nb",
            validation: rule => rule.required(),
        }),
        defineField({
            name: "descriptionNb",
            title: "Beskrivelse",
            type: "text",
            rows: 8,
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
            name: "descriptionEn",
            title: "Description",
            type: "text",
            rows: 8,
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
        orderRankField({ type: "homeBar" }),
    ],
    orderings: [orderRankOrdering],
    preview: {
        select: {
            title: "nameNb",
            subtitle: "nameEn",
            media: "image",
        },
        prepare({ title, subtitle, media }) {
            return {
                title: title ?? subtitle ?? "Forsidebar",
                subtitle: subtitle && subtitle !== title ? subtitle : undefined,
                media,
            }
        },
    },
})
