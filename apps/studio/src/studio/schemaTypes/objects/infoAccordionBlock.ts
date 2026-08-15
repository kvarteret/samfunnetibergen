import { icons } from "@sanity/icons"
import { defineArrayMember, defineField, defineType } from "sanity"
import { localizedArrayField } from "../shared/localizedFields"

export const infoAccordionItem = defineType({
  name: "infoAccordionItem",
  title: "Trekkspill-seksjon",
  type: "object",
  fields: [
    localizedArrayField(
      "localizedTitle",
      "Tittel",
      "internationalizedArrayString",
      { required: true },
    ),
    localizedArrayField(
      "localizedBody",
      "Innhold",
      "internationalizedArrayPortableTextContent",
      { required: true },
    ),
  ],
  preview: {
    select: { title: "localizedTitle" },
    prepare({ title }) {
      return {
        title: Array.isArray(title)
          ? (title.find(item => item?.language === "nb")?.value ?? "Seksjon")
          : (title ?? "Seksjon"),
      }
    },
  },
})

export const infoAccordionBlock = defineType({
  name: "infoAccordionBlock",
  title: "Trekkspill-blokk",
  type: "object",
  icon: icons["chevron-down"],
  fields: [
    localizedArrayField(
      "localizedHeading",
      "Overskrift",
      "internationalizedArrayString",
      { required: true },
    ),
    localizedArrayField(
      "localizedIntro",
      "Ingress",
      "internationalizedArrayText",
      {
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
    select: { title: "localizedHeading", items: "items" },
    prepare({ title, items }) {
      const count = Array.isArray(items) ? items.length : 0
      const localizedTitle = Array.isArray(title)
        ? title.find(item => item?.language === "nb")?.value
        : title
      return {
        title: localizedTitle ?? "Trekkspill",
        subtitle: `${count} seksjoner`,
      }
    },
  },
})
