import { icons } from "@sanity/icons"
import { defineArrayMember, defineField, defineType } from "sanity"
import {
  deprecatedLegacyField,
  localizedArrayField,
} from "../shared/localizedFields"

export const infoAccordionItem = defineType({
  name: "infoAccordionItem",
  title: "Trekkspill-seksjon",
  type: "object",
  fields: [
    deprecatedLegacyField("title", "Tittel (legacy)", "string"),
    localizedArrayField(
      "localizedTitle",
      "Tittel",
      "internationalizedArrayString",
      { required: true, legacyField: "title" },
    ),
    deprecatedLegacyField("body", "Innhold (legacy)", "portableTextContent"),
    localizedArrayField(
      "localizedBody",
      "Innhold",
      "internationalizedArrayPortableTextContent",
      { required: true, legacyField: "body" },
    ),
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
  icon: icons["chevron-down"],
  fields: [
    deprecatedLegacyField("heading", "Overskrift (legacy)", "string"),
    localizedArrayField(
      "localizedHeading",
      "Overskrift",
      "internationalizedArrayString",
      { required: true, legacyField: "heading" },
    ),
    deprecatedLegacyField("intro", "Ingress (legacy)", "text", { rows: 3 }),
    localizedArrayField(
      "localizedIntro",
      "Ingress",
      "internationalizedArrayText",
      {
        legacyField: "intro",
        rows: 3,
      },
    ),
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
