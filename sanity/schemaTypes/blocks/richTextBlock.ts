import { DocumentTextIcon } from "@sanity/icons"
import { defineArrayMember, defineField, defineType } from "sanity"

export const richTextBlock = defineType({
    name: "richTextBlock",
    title: "Tekstblokk",
    type: "object",
    icon: DocumentTextIcon,
    fields: [
        defineField({
            name: "title",
            title: "Overskrift",
            description: "Valgfri overskrift over tekstblokken",
            type: "string",
        }),
        defineField({
            name: "content",
            title: "Innhold",
            type: "portableTextContent",
            validation: rule => rule.required(),
        }),
        defineField({
            name: "columns",
            title: "Kolonner",
            type: "string",
            options: {
                list: [
                    { title: "En kolonne", value: "1" },
                    { title: "To kolonner", value: "2" },
                ],
                layout: "radio",
            },
            initialValue: "1",
        }),
    ],
    preview: {
        select: { title: "title" },
        prepare({ title }) {
            return { title: title || "Tekstblokk", subtitle: "Tekstinnhold" }
        },
    },
})
