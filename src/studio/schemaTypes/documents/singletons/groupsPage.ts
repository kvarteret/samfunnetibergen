import { UsersIcon } from "@sanity/icons"
import { defineArrayMember, defineField, defineType } from "sanity"

import {
  createSeoFields,
  createSharingFields,
} from "../../shared/metadataFields"

export const groupsPage = defineType({
  name: "groupsPage",
  title: "Grupper-side",
  type: "document",
  icon: UsersIcon,
  groups: [
    { name: "hero", title: "Hero", default: true },
    { name: "intro", title: "Introduksjon" },
    { name: "faq", title: "FAQ" },
    { name: "seo", title: "SEO" },
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
      name: "sections",
      title: "Introduksjon",
      description: "Valgfrie tekstseksjoner som vises over gruppelisten.",
      type: "array",
      group: "intro",
      of: [defineArrayMember({ type: "editorialSection" })],
    }),
    ...createSeoFields(),
    ...createSharingFields({ group: "seo" }),
    defineField({
      name: "faq",
      title: "FAQ",
      type: "array",
      group: "faq",
      of: [
        defineArrayMember({
          name: "faqItem",
          type: "object",
          fields: [
            defineField({
              name: "question",
              title: "Spørsmål",
              type: "string",
              validation: rule => rule.required(),
            }),
            defineField({
              name: "answer",
              title: "Svar",
              type: "array",
              of: [defineArrayMember({ type: "text" })],
              validation: rule => rule.required().min(1),
            }),
          ],
          preview: { select: { title: "question" } },
        }),
      ],
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare({ title }) {
      return { title: title ?? "Grupper-side" }
    },
  },
})
