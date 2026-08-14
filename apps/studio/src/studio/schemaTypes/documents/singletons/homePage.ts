import { icons } from "@sanity/icons"
import { defineField, defineType } from "sanity"
import {
  deprecatedLegacyField,
  localizedArrayField,
} from "../../shared/localizedFields"

export const homePage = defineType({
  name: "homePage",
  title: "Hovedside",
  type: "document",
  icon: icons.document,
  groups: [{ name: "hero", title: "Hero", default: true }],
  fields: [
    deprecatedLegacyField("eyebrow", "Eyebrow (legacy)", "string", {
      group: "hero",
    }),
    localizedArrayField(
      "localizedEyebrow",
      "Eyebrow",
      "internationalizedArrayString",
      {
        legacyField: "eyebrow",
        group: "hero",
      },
    ),
    deprecatedLegacyField("title", "Tittel (legacy)", "string", {
      group: "hero",
    }),
    localizedArrayField(
      "localizedTitle",
      "Tittel",
      "internationalizedArrayString",
      {
        required: true,
        legacyField: "title",
        group: "hero",
      },
    ),
    deprecatedLegacyField("description", "Beskrivelse (legacy)", "text", {
      rows: 4,
      group: "hero",
    }),
    localizedArrayField(
      "localizedDescription",
      "Beskrivelse",
      "internationalizedArrayText",
      { legacyField: "description", rows: 4, group: "hero" },
    ),
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
