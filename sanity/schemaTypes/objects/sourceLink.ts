import { LinkIcon } from "@sanity/icons"
import { defineField, defineType } from "sanity"

export const sourceLink = defineType({
    name: "sourceLink",
    title: "Link",
    type: "object",
    icon: LinkIcon,
    fields: [
        defineField({
            name: "label",
            title: "Label",
            type: "string",
            validation: rule => rule.required(),
        }),
        defineField({
            name: "url",
            title: "URL",
            type: "url",
            validation: rule => rule.required().uri({ scheme: ["http", "https", "mailto"] }),
        }),
    ],
    preview: {
        select: { title: "label", subtitle: "url" },
    },
})
