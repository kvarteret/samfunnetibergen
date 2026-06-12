import { StarIcon } from "@sanity/icons"
import { defineArrayMember, defineField, defineType } from "sanity"

import {
  createSeoFields,
  createSharingFields,
} from "../../shared/metadataFields"

export const sponsorsPage = defineType({
  name: "sponsorsPage",
  title: "Sponsorer-side",
  type: "document",
  icon: StarIcon,
  groups: [
    { name: "hero", title: "Hero", default: true },
    { name: "sponsors", title: "Sponsorer" },
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
      name: "sponsors",
      title: "Sponsorer",
      type: "array",
      group: "sponsors",
      of: [
        defineArrayMember({
          name: "sponsor",
          title: "Sponsor",
          type: "object",
          fields: [
            defineField({
              name: "logo",
              title: "Logo",
              type: "image",
              options: { hotspot: true },
            }),
            defineField({
              name: "title",
              title: "Tittel",
              type: "string",
              validation: rule => rule.required(),
            }),
            defineField({
              name: "description",
              title: "Beskrivelse",
              type: "portableTextContent",
            }),
            defineField({
              name: "website",
              title: "Nettsted",
              type: "url",
              validation: rule => rule.uri({ scheme: ["http", "https"] }),
            }),
          ],
          preview: {
            select: { title: "title", media: "logo" },
          },
        }),
      ],
    }),
    ...createSeoFields(),
    ...createSharingFields({ group: "seo" }),
  ],
  preview: {
    select: { title: "title" },
    prepare({ title }) {
      return { title: title ?? "Sponsorer-side" }
    },
  },
})
