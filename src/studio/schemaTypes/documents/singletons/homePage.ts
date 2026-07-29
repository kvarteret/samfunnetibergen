import { DocumentIcon } from "@sanity/icons/Document"
import { defineField, defineType } from "sanity"

import {
  createSeoFields,
  createSharingFields,
} from "../../shared/metadataFields"

export const homePage = defineType({
  name: "homePage",
  title: "Hovedside",
  type: "document",
  icon: DocumentIcon,
  groups: [
    { name: "hero", title: "Hero", default: true },
    { name: "seo", title: "SEO" },
    { name: "sharing", title: "Deling" },
  ],
  fields: [
    defineField({
      name: "eyebrow",
      title: "Eyebrow",
      type: "string",
      group: "hero",
    }),
    defineField({
      name: "title",
      title: "Tittel",
      type: "string",
      group: "hero",
      validation: rule => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Beskrivelse",
      type: "text",
      rows: 4,
      group: "hero",
    }),
    defineField({
      name: "primaryCta",
      title: "Primærknapp",
      type: "sourceLink",
      group: "hero",
    }),
    ...createSeoFields({
      titleDescription: "Overstyrer sidetittelen i søkemotorer.",
    }),
    ...createSharingFields(),
  ],
  preview: {
    select: { title: "title" },
    prepare({ title }) {
      return { title: title ?? "Hovedside" }
    },
  },
})
