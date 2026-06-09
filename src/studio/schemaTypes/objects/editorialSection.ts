import { DocumentTextIcon } from "@sanity/icons"
import { defineArrayMember, defineField, defineType } from "sanity"

export const editorialSection = defineType({
  name: "editorialSection",
  title: "Tekstseksjon",
  type: "object",
  icon: DocumentTextIcon,
  fields: [
    defineField({ name: "title", title: "Tittel", type: "string" }),
    defineField({
      name: "paragraphs",
      title: "Avsnitt",
      type: "array",
      of: [defineArrayMember({ type: "text" })],
      validation: rule => rule.required().min(1),
    }),
    defineField({
      name: "links",
      title: "Lenker",
      type: "array",
      of: [defineArrayMember({ type: "sourceLink" })],
    }),
  ],
  preview: {
    select: { title: "title", paragraphs: "paragraphs" },
    prepare({ title, paragraphs }) {
      return { title: title || paragraphs?.[0] || "Tekstseksjon" }
    },
  },
})
