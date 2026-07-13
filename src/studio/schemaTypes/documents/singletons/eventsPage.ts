import { icons } from "@sanity/icons"
import { defineField, defineType } from "sanity"

export const eventsPage = defineType({
  name: "eventsPage",
  title: "Arrangementer-side",
  type: "document",
  icon: icons.document,
  groups: [
    { name: "content", title: "Innhold", default: true },
  ],
  fields: [
    defineField({ name: "eyebrow", title: "Eyebrow", type: "string" }),
    defineField({ name: "title", title: "Tittel", type: "string" }),
    defineField({ name: "description", title: "Beskrivelse", type: "text" }),
  ],
  preview: {
    select: { title: "title" },
    prepare({ title }) {
      return { title: title ?? "Arrangementer-side" }
    },
  },
})
