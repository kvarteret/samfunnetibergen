import { icons } from "@sanity/icons"
import {
  orderRankField,
  orderRankOrdering,
} from "@sanity/orderable-document-list"
import { defineField, defineType } from "sanity"
import {
  deprecatedLegacyField,
  localizedArrayField,
} from "../shared/localizedFields"

export const eventTaxonomyGroup = defineType({
  name: "eventTaxonomyGroup",
  title: "Kategori",
  type: "document",
  icon: icons.tag,
  fields: [
    deprecatedLegacyField("name", "Navn (legacy)", "string"),
    localizedArrayField(
      "localizedName",
      "Navn",
      "internationalizedArrayString",
      { required: true, legacyField: "name" },
    ),
    orderRankField({ type: "eventTaxonomyGroup" }),
  ],
  preview: {
    select: {
      title: "localizedName",
      legacyTitle: "name",
    },
    prepare({ title, legacyTitle }) {
      return {
        title:
          (Array.isArray(title)
            ? title.find(item => item?.language === "nb")?.value
            : title) ??
          legacyTitle ??
          "Gruppe",
      }
    },
  },
  orderings: [orderRankOrdering],
})
