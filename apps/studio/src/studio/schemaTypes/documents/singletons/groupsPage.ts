import { icons } from "@sanity/icons"
import { defineArrayMember, defineField, defineType } from "sanity"
import {
  deprecatedLegacyField,
  localizedArrayField,
} from "../../shared/localizedFields"

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
    deprecatedLegacyField("eyebrow", "Eyebrow (legacy)", "string", {
      group: "hero",
    }),
    localizedArrayField(
      "localizedEyebrow",
      "Eyebrow",
      "internationalizedArrayString",
      {
        legacyField: "eyebrow",
        description: "Kanonisk tekst per språk.",
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
      { legacyField: "description", group: "hero" },
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
            deprecatedLegacyField("question", "Spørsmål (legacy)", "string"),
            localizedArrayField(
              "localizedQuestion",
              "Spørsmål",
              "internationalizedArrayString",
              { required: true, legacyField: "question" },
            ),
            deprecatedLegacyField("answer", "Svar (legacy)", "array", {
              of: [defineArrayMember({ type: "text" })],
            }),
            localizedArrayField(
              "localizedAnswer",
              "Svar",
              "internationalizedArrayText",
              {
                required: true,
                legacyField: "answer",
                description:
                  "Skriv ett avsnitt per linje. Linjeskift brukes som avsnitt på nettsiden.",
              },
            ),
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
