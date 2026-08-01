import { icons } from "@sanity/icons"
import { defineField, defineType } from "sanity"

export const infoAddressBlock = defineType({
  name: "infoAddressBlock",
  title: "Adkomst-blokk",
  type: "object",
  icon: icons.pin,
  fields: [
    defineField({
      name: "heading",
      title: "Overskrift",
      type: "string",
      validation: rule => rule.required(),
    }),
    defineField({
      name: "body",
      title: "Tekst",
      type: "portableTextContent",
    }),
    defineField({
      name: "address",
      title: "Adresse",
      type: "string",
    }),
    defineField({
      name: "mapUrl",
      title: "Kart-lenke",
      type: "url",
      validation: rule => rule.uri({ scheme: ["http", "https"] }),
    }),
  ],
  preview: {
    select: { title: "heading", subtitle: "address" },
    prepare({ title, subtitle }) {
      return { title: title ?? "Adkomst", subtitle }
    },
  },
})
