import { DocumentIcon } from "@sanity/icons"
import { defineField, defineType } from "sanity"

import {
  createSeoFields,
  createSharingFields,
} from "../../shared/metadataFields"

export const eventsPage = defineType({
  name: "eventsPage",
  title: "Arrangementer-side",
  type: "document",
  icon: DocumentIcon,
  groups: [
    { name: "content", title: "Innhold", default: true },
    { name: "seo", title: "SEO" },
    { name: "sharing", title: "Deling" },
  ],
  fields: [
    defineField({ name: "eyebrow", title: "Eyebrow", type: "string" }),
    defineField({ name: "title", title: "Tittel", type: "string" }),
    defineField({ name: "description", title: "Beskrivelse", type: "text" }),
    ...createSeoFields(),
    ...createSharingFields(),
  ],
  preview: {
    select: { title: "title" },
    prepare({ title }) {
      return { title: title ?? "Arrangementer-side" }
    },
  },
})
