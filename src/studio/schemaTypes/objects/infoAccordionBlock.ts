import { ChevronDownIcon } from "@sanity/icons"
import { defineArrayMember, defineField, defineType } from "sanity"

export const infoAccordionItem = defineType({
  name: "infoAccordionItem",
  title: "Trekkspill-seksjon",
  type: "object",
  fields: [
    defineField({
      name: "title",
      title: "Tittel",
      type: "string",
      validation: rule => rule.required(),
    }),
    defineField({
      name: "body",
      title: "Innhold",
      type: "portableTextContent",
      validation: rule => rule.required(),
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare({ title }) {
      return { title: title ?? "Seksjon" }
    },
  },
})

export const infoAccordionBlock = defineType({
  name: "infoAccordionBlock",
  title: "Trekkspill-blokk",
  type: "object",
  icon: ChevronDownIcon,
  fields: [
    defineField({
      name: "heading",
      title: "Overskrift",
      type: "string",
      validation: rule => rule.required(),
    }),
    defineField({
      name: "intro",
      title: "Ingress",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "items",
      title: "Seksjoner",
      type: "array",
      of: [defineArrayMember({ type: "infoAccordionItem" })],
      validation: rule => rule.required().min(1),
    }),
  ],
  preview: {
    select: { title: "heading", items: "items" },
    prepare({ title, items }) {
      const count = Array.isArray(items) ? items.length : 0
      return { title: title ?? "Trekkspill", subtitle: `${count} seksjoner` }
    },
  },
})
