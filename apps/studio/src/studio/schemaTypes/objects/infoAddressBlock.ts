import { icons } from "@sanity/icons"
import { defineField, defineType } from "sanity"
import { localizedArrayField } from "../shared/localizedFields"

export const infoAddressBlock = defineType({
  name: "infoAddressBlock",
  title: "Adkomst-blokk",
  type: "object",
  icon: icons.pin,
  fields: [
    localizedArrayField(
      "localizedHeading",
      "Overskrift",
      "internationalizedArrayString",
      { required: true },
    ),
    localizedArrayField(
      "localizedBody",
      "Tekst",
      "internationalizedArrayPortableTextContent",
      {},
    ),
    localizedArrayField(
      "localizedAddress",
      "Adresse",
      "internationalizedArrayString",
      {},
    ),
    defineField({
      name: "mapUrl",
      title: "Kart-lenke",
      type: "url",
      validation: rule => rule.uri({ scheme: ["http", "https"] }),
    }),
  ],
  preview: {
    select: { title: "localizedHeading", subtitle: "localizedAddress" },
    prepare({ title, subtitle }) {
      const localized = (value: unknown) =>
        Array.isArray(value)
          ? value.find(item => item?.language === "nb")?.value
          : value
      return {
        title: localized(title) ?? "Adkomst",
        subtitle: localized(subtitle),
      }
    },
  },
})
