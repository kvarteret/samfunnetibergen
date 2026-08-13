import { icons } from "@sanity/icons"
import { defineField, defineType } from "sanity"

export const homePage = defineType({
  name: "homePage",
  title: "Hovedside",
  type: "document",
  icon: icons.document,
  groups: [{ name: "hero", title: "Hero", default: true }],
  fields: [
    defineField({
      name: "eyebrow",
      title: "Eyebrow",
      type: "string",
      group: "hero",
    }),
    defineField({
      name: "localizedEyebrow",
      title: "Eyebrow (oversettelser)",
      type: "internationalizedArrayString",
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
      name: "localizedTitle",
      title: "Tittel (oversettelser)",
      type: "internationalizedArrayString",
      group: "hero",
    }),
    defineField({
      name: "description",
      title: "Beskrivelse",
      type: "text",
      rows: 4,
      group: "hero",
    }),
    defineField({
      name: "localizedDescription",
      title: "Beskrivelse (oversettelser)",
      type: "internationalizedArrayText",
      group: "hero",
    }),
    defineField({
      name: "primaryCta",
      title: "Primærknapp",
      type: "sourceLink",
      group: "hero",
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare({ title }) {
      return { title: title ?? "Hovedside" }
    },
  },
})
