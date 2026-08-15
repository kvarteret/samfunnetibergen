import { icons } from "@sanity/icons"
import { defineField, defineType } from "sanity"
import { localizedArrayField } from "../shared/localizedFields"

export const editorialSection = defineType({
  name: "editorialSection",
  title: "Tekstseksjon",
  type: "object",
  icon: icons["document-text"],
  fields: [
    localizedArrayField(
      "localizedTitle",
      "Tittel",
      "internationalizedArrayString",
      {},
    ),
    localizedArrayField(
      "localizedBody",
      "Innhold",
      "internationalizedArrayPortableTextContent",
      {
        required: true,
        description: "Tekst med lenker i løpende innhold.",
      },
    ),
  ],
  preview: {
    select: { title: "localizedTitle", body: "localizedBody" },
    prepare({ title, body }) {
      const localizedTitle = Array.isArray(title)
        ? title.find(item => item?.language === "nb")?.value
        : title
      const localizedBody = Array.isArray(body)
        ? body.find(item => item?.language === "nb")?.value
        : body
      const bodyPreview = Array.isArray(localizedBody)
        ? localizedBody
            .flatMap(block =>
              Array.isArray(block?.children)
                ? block.children.map((child: { text?: string }) => child.text)
                : [],
            )
            .filter(Boolean)
            .join(" ")
        : undefined
      return {
        title: localizedTitle || bodyPreview || "Tekstseksjon",
      }
    },
  },
})
