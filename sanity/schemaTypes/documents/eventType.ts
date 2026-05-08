import { TagIcon } from "@sanity/icons"
import { defineField, defineType } from "sanity"

export const eventType = defineType({
    name: "eventType",
    title: "Arrangementtype",
    type: "document",
    icon: TagIcon,
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
            name: "taxonomyGroup",
            title: "Taksonomigruppe",
            type: "reference",
            to: [{ type: "eventTaxonomyGroup" }],
        }),
        defineField({
            name: "description",
            title: "Beskrivelse",
            type: "text",
            rows: 2,
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
            group: "taxonomyGroup.name",
        },
        prepare({ title, group }) {
            return { title: title ?? "Type", subtitle: group }
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
