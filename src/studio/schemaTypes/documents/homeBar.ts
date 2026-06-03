import { ComponentIcon } from "@sanity/icons"
import { orderRankField, orderRankOrdering } from "@sanity/orderable-document-list"
import { defineField, defineType } from "sanity"

export const homeBar = defineType({
    name: "homeBar",
    title: "Forsidebar",
    type: "document",
    icon: ComponentIcon,
    groups: [
        { name: "content", title: "Innhold", default: true },
        { name: "media", title: "Bilde" },
    ],
    fields: [
        defineField({
            name: "nameNb",
            title: "Navn",
            type: "string",
            group: "content",
            validation: rule => rule.required(),
        }),
        defineField({
            name: "descriptionNb",
            title: "Beskrivelse",
            type: "text",
            rows: 8,
            group: "content",
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
            media: "image",
        },
        prepare({ title, media }) {
            return {
                title: title ?? "Forsidebar",
                media,
            }
        },
    },
})
