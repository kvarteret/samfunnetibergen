import { icons } from "@sanity/icons"
import { defineArrayMember, defineField, defineType } from "sanity"
import {
  deprecatedLegacyField,
  localizedArrayField,
} from "../../shared/localizedFields"

export const sponsorsPage = defineType({
  name: "sponsorsPage",
  title: "Sponsorer-side",
  type: "document",
  icon: icons.star,
  groups: [
    { name: "hero", title: "Hero", default: true },
    { name: "sponsors", title: "Sponsorer" },
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
            localizedArrayField(
              "localizedLogoAlt",
              "Logo alt-tekst",
              "internationalizedArrayString",
              {
                description: "Beskriv logoen per språk for tilgjengelighet.",
              },
            ),
            deprecatedLegacyField("title", "Tittel (legacy)", "string"),
            localizedArrayField(
              "localizedTitle",
              "Tittel",
              "internationalizedArrayString",
              { required: true, legacyField: "title" },
            ),
            deprecatedLegacyField(
              "description",
              "Beskrivelse (legacy)",
              "portableTextContent",
            ),
            localizedArrayField(
              "localizedDescription",
              "Beskrivelse",
              "internationalizedArrayPortableTextContent",
              { legacyField: "description" },
            ),
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
  ],
  preview: {
    select: { title: "title" },
    prepare({ title }) {
      return { title: title ?? "Sponsorer-side" }
    },
  },
})
