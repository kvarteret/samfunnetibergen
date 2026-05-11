import { LinkIcon } from "@sanity/icons"
import { defineField, defineType } from "sanity"

const externalUrlPattern = /^(https?:\/\/|mailto:)/i
const internalPathPattern = /^\/(?!\/)/

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
            type: "string",
            description: "Intern sti (/karaoke) eller ekstern URL (https://…)",
            validation: rule =>
                rule.required().custom(value => {
                    if (!value) return true
                    if (internalPathPattern.test(value) || externalUrlPattern.test(value)) {
                        return true
                    }
                    return "Bruk en intern sti som /karaoke eller en ekstern URL som starter med https://, http:// eller mailto:"
                }),
        }),
    ],
    preview: {
        select: { title: "label", subtitle: "url" },
    },
})
