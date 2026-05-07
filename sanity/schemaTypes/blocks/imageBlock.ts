import { ImageIcon } from "@sanity/icons"
import { defineField, defineType } from "sanity"

export const imageBlock = defineType({
    name: "imageBlock",
    title: "Bilde",
    type: "object",
    icon: ImageIcon,
    fields: [
        defineField({
            name: "image",
            title: "Bilde",
            type: "image",
            options: { hotspot: true },
            validation: rule => rule.required(),
        }),
        defineField({
            name: "alt",
            title: "Alt-tekst",
            type: "string",
            validation: rule => rule.required(),
        }),
        defineField({
            name: "caption",
            title: "Bildetekst",
            type: "string",
        }),
        defineField({
            name: "size",
            title: "Størrelse",
            type: "string",
            options: {
                list: [
                    { title: "Normal bredde", value: "normal" },
                    { title: "Full bredde", value: "full" },
                ],
                layout: "radio",
            },
            initialValue: "normal",
        }),
    ],
    preview: {
        select: { title: "alt", subtitle: "caption", media: "image" },
        prepare({ title, subtitle, media }) {
            return { title: title || "Bilde", subtitle: subtitle || "Bildeblokk", media }
        },
    },
})
