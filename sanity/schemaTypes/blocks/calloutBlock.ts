import { InfoOutlineIcon } from "@sanity/icons"
import { defineArrayMember, defineField, defineType } from "sanity"

export const calloutBlock = defineType({
    name: "calloutBlock",
    title: "Uthevet boks",
    type: "object",
    icon: InfoOutlineIcon,
    fields: [
        defineField({
            name: "title",
            title: "Tittel",
            type: "string",
        }),
        defineField({
            name: "content",
            title: "Innhold",
            type: "portableTextContent",
            validation: rule => rule.required(),
        }),
        defineField({
            name: "tone",
            title: "Stil",
            type: "string",
            options: {
                list: [
                    { title: "Nøytral", value: "neutral" },
                    { title: "Info", value: "info" },
                    { title: "Advarsel", value: "warning" },
                ],
                layout: "radio",
            },
            initialValue: "neutral",
        }),
        defineField({
            name: "links",
            title: "Lenker",
            type: "array",
            of: [defineArrayMember({ type: "sourceLink" })],
        }),
    ],
    preview: {
        select: { title: "title", tone: "tone" },
        prepare({ title, tone }) {
            return { title: title || "Uthevet boks", subtitle: tone || "neutral" }
        },
    },
})
