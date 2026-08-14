import { icons } from "@sanity/icons"
import { defineField, defineType } from "sanity"
import {
  deprecatedLegacyField,
  localizedArrayField,
} from "../shared/localizedFields"

export const editorialSection = defineType({
  name: "editorialSection",
  title: "Tekstseksjon",
  type: "object",
  icon: icons["document-text"],
  fields: [
    deprecatedLegacyField("title", "Tittel (legacy)", "string"),
    localizedArrayField(
      "localizedTitle",
      "Tittel",
      "internationalizedArrayString",
      { legacyField: "title" },
    ),
    deprecatedLegacyField("body", "Innhold (legacy)", "portableTextContent", {
      description: "Bruk det lokaliserte innholdsfeltet nedenfor.",
    }),
    localizedArrayField(
      "localizedBody",
      "Innhold",
      "internationalizedArrayPortableTextContent",
      {
        required: true,
        legacyField: "body",
        description: "Tekst med lenker i løpende innhold.",
      },
    ),
  ],
  preview: {
    select: { title: "title", body: "body" },
    prepare({ title, body }) {
      const bodyPreview = Array.isArray(body)
        ? body
            .flatMap(block =>
              Array.isArray(block?.children)
                ? block.children.map((child: { text?: string }) => child.text)
                : [],
            )
            .filter(Boolean)
            .join(" ")
        : undefined
      return {
        title: title || bodyPreview || "Tekstseksjon",
      }
    },
  },
})
