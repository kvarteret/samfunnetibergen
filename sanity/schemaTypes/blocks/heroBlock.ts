import { InlineIcon } from "@sanity/icons"
import { defineField, defineType } from "sanity"

export const heroBlock = defineType({
    name: "heroBlock",
    title: "Hero",
    type: "object",
    icon: InlineIcon,
    fields: [
        defineField({
            name: "eyebrow",
            title: "Eyebrow",
            description: "Kort tekst over tittelen",
            type: "string",
        }),
        defineField({
            name: "title",
            title: "Tittel",
            type: "string",
            validation: rule => rule.required(),
        }),
        defineField({
            name: "lead",
            title: "Ingress",
            type: "text",
            rows: 3,
        }),
        defineField({
            name: "image",
            title: "Bilde",
            type: "image",
            options: { hotspot: true },
        }),
        defineField({
            name: "cta",
            title: "Knapp",
            type: "sourceLink",
        }),
    ],
    preview: {
        select: { title: "title", subtitle: "eyebrow", media: "image" },
        prepare({ title, subtitle, media }) {
            return { title: title || "Hero", subtitle: subtitle || "Hero-seksjon", media }
        },
    },
})
