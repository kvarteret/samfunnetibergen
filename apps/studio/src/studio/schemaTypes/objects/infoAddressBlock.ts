import { icons } from "@sanity/icons"
import { defineField, defineType } from "sanity"
import {
  deprecatedLegacyField,
  localizedArrayField,
} from "../shared/localizedFields"

export const infoAddressBlock = defineType({
  name: "infoAddressBlock",
  title: "Adkomst-blokk",
  type: "object",
  icon: icons.pin,
  fields: [
    deprecatedLegacyField("heading", "Overskrift (legacy)", "string"),
    localizedArrayField(
      "localizedHeading",
      "Overskrift",
      "internationalizedArrayString",
      { required: true, legacyField: "heading" },
    ),
    deprecatedLegacyField("body", "Tekst (legacy)", "portableTextContent"),
    localizedArrayField(
      "localizedBody",
      "Tekst",
      "internationalizedArrayPortableTextContent",
      { legacyField: "body" },
    ),
    deprecatedLegacyField("address", "Adresse (legacy)", "string"),
    localizedArrayField(
      "localizedAddress",
      "Adresse",
      "internationalizedArrayString",
      { legacyField: "address" },
    ),
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
