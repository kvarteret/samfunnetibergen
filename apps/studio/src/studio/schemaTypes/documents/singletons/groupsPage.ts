import { icons } from "@sanity/icons"
import { defineArrayMember, defineField, defineType } from "sanity"
import { localizedArrayField } from "../../shared/localizedFields"

export const groupsPage = defineType({
  name: "groupsPage",
  title: "Grupper-side",
  type: "document",
  icon: icons.users,
  groups: [
    { name: "hero", title: "Hero", default: true },
    { name: "intro", title: "Introduksjon" },
    { name: "faq", title: "FAQ" },
  ],
  fields: [
    localizedArrayField(
      "localizedEyebrow",
      "Eyebrow",
      "internationalizedArrayString",
      {
        description: "Kanonisk tekst per språk.",
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
      { group: "hero" },
    ),
    defineField({
      name: "sections",
      title: "Introduksjon",
      description: "Valgfrie tekstseksjoner som vises over gruppelisten.",
      type: "array",
      group: "intro",
      of: [defineArrayMember({ type: "editorialSection" })],
    }),
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
            localizedArrayField(
              "localizedQuestion",
              "Spørsmål",
              "internationalizedArrayString",
              { required: true },
            ),
            localizedArrayField(
              "localizedAnswer",
              "Svar",
              "internationalizedArrayText",
              {
                required: true,
                description:
                  "Skriv ett avsnitt per linje. Linjeskift brukes som avsnitt på nettsiden.",
              },
            ),
          ],
          preview: {
            select: { title: "localizedQuestion" },
            prepare({ title }) {
              return {
                title: Array.isArray(title)
                  ? title.find(item => item?.language === "nb")?.value
                  : title,
              }
            },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: { title: "localizedTitle" },
    prepare({ title }) {
      return {
        title: Array.isArray(title)
          ? (title.find(item => item?.language === "nb")?.value ??
            "Grupper-side")
          : (title ?? "Grupper-side"),
      }
    },
  },
})
