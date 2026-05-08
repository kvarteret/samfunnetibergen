import { TagIcon } from "@sanity/icons"
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
            name: "sortOrder",
            title: "Sorteringsrekkefølge",
            type: "number",
            initialValue: 0,
        }),
        defineField({
            name: "isActive",
            title: "Aktiv",
            type: "boolean",
            initialValue: true,
        }),
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
    orderings: [
        {
            title: "Sorteringsrekkefølge",
            name: "sortOrder",
            by: [{ field: "sortOrder", direction: "asc" }],
        },
    ],
})
