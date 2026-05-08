import { TagIcon } from "@sanity/icons"
import { orderRankField, orderRankOrdering } from "@sanity/orderable-document-list"
import { defineField, defineType } from "sanity"

export const eventTaxonomyGroup = defineType({
    name: "eventTaxonomyGroup",
    title: "Taksonomigruppe",
    type: "document",
    icon: TagIcon,
    fields: [
        defineField({
            name: "name",
            title: "Navn (norsk)",
            type: "string",
            validation: rule => rule.required(),
        }),
        defineField({
            name: "nameEn",
            title: "Navn (engelsk)",
            type: "string",
        }),
        defineField({
            name: "slug",
            title: "Slug",
            type: "slug",
            options: { source: "name" },
            validation: rule => rule.required(),
        }),
        defineField({
            name: "isActive",
            title: "Aktiv",
            type: "boolean",
            initialValue: true,
        }),
        orderRankField({ type: "eventTaxonomyGroup" }),
    ],
    preview: {
        select: {
            title: "name",
            subtitle: "nameEn",
        },
        prepare({ title, subtitle }) {
            return { title: title ?? "Gruppe", subtitle }
        },
    },
    orderings: [orderRankOrdering],
})
