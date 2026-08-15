import { icons } from "@sanity/icons"
import { defineArrayMember, defineField, defineType } from "sanity"
import { localizedArrayField } from "../../shared/localizedFields"

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
            localizedArrayField(
              "localizedTitle",
              "Tittel",
              "internationalizedArrayString",
              { required: true },
            ),
            localizedArrayField(
              "localizedDescription",
              "Beskrivelse",
              "internationalizedArrayPortableTextContent",
              {},
            ),
            defineField({
              name: "website",
              title: "Nettsted",
              type: "url",
              validation: rule => rule.uri({ scheme: ["http", "https"] }),
            }),
          ],
          preview: {
            select: { title: "localizedTitle", media: "logo" },
            prepare({ title, media }) {
              return {
                title: Array.isArray(title)
                  ? title.find(item => item?.language === "nb")?.value
                  : title,
                media,
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
            "Sponsorer-side")
          : (title ?? "Sponsorer-side"),
      }
    },
  },
})
