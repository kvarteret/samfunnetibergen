import { icons } from "@sanity/icons"
import { defineField, defineType } from "sanity"
import { localizedArrayField } from "../../shared/localizedFields"

export const homePage = defineType({
  name: "homePage",
  title: "Hovedside",
  type: "document",
  icon: icons.document,
  groups: [{ name: "hero", title: "Hero", default: true }],
  fields: [
    localizedArrayField(
      "localizedEyebrow",
      "Eyebrow",
      "internationalizedArrayString",
      {
        group: "hero",
      },
    ),
    localizedArrayField(
      "localizedTitle",
      "Tittel",
      "internationalizedArrayString",
      {
        required: true,
        group: "hero",
      },
    ),
    localizedArrayField(
      "localizedDescription",
      "Beskrivelse",
      "internationalizedArrayText",
      { rows: 4, group: "hero" },
    ),
    defineField({
      name: "primaryCta",
      title: "Primærknapp",
      type: "sourceLink",
      group: "hero",
    }),
  ],
  preview: {
    select: { title: "localizedTitle" },
    prepare({ title }) {
      return {
        title: Array.isArray(title)
          ? (title.find(item => item?.language === "nb")?.value ?? "Hovedside")
          : (title ?? "Hovedside"),
      }
    },
  },
})
