import { icons } from "@sanity/icons"
import { defineField, defineType } from "sanity"

export const editorialSection = defineType({
  name: "editorialSection",
  title: "Tekstseksjon",
  type: "object",
  icon: icons["document-text"],
  fields: [
    defineField({ name: "title", title: "Tittel", type: "string" }),
    defineField({
      name: "localizedTitle",
      title: "Tittel (oversettelser)",
      type: "internationalizedArrayString",
    }),
    defineField({
      name: "body",
      title: "Innhold",
      type: "portableTextContent",
      description: "Bruk dette for tekst med lenker i løpende innhold.",
      validation: rule => rule.required(),
    }),
    defineField({
      name: "localizedBody",
      title: "Innhold (oversettelser)",
      type: "internationalizedArrayPortableTextContent",
    }),
  ],
  preview: {
    select: { title: "title", body: "body" },
    prepare({ title, body }) {
      const bodyPreview = Array.isArray(body)
        ? body
            .flatMap(block =>
              Array.isArray(block?.children)
                ? block.children.map((child: { text?: string }) => child.text)
                : [],
            )
            .filter(Boolean)
            .join(" ")
        : undefined
      return {
        title: title || bodyPreview || "Tekstseksjon",
      }
    },
  },
})
