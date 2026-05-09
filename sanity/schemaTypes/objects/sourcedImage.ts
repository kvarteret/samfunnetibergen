import { ImageIcon } from "@sanity/icons"
import { defineField, defineType } from "sanity"

export const sourcedImage = defineType({
    name: "sourcedImage",
    title: "Image",
    type: "object",
    icon: ImageIcon,
    fields: [
        defineField({
            name: "image",
            title: "Image",
            type: "image",
            options: { hotspot: true },
        }),
        defineField({
            name: "alt",
            title: "Alt Text",
            type: "string",
            validation: rule => rule.required(),
        }),
        defineField({
            name: "caption",
            title: "Caption",
            type: "string",
        }),
    ],
    validation: rule =>
        rule.custom(value => {
            if (!value?.image) {
                return "Legg til et bilde."
            }
            return true
        }),
    preview: {
        select: { title: "alt", media: "image" },
    },
})
