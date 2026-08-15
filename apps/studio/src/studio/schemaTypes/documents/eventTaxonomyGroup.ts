import { icons } from "@sanity/icons"
import {
  orderRankField,
  orderRankOrdering,
} from "@sanity/orderable-document-list"
import { defineField, defineType } from "sanity"
import { localizedArrayField } from "../shared/localizedFields"

export const eventTaxonomyGroup = defineType({
  name: "eventTaxonomyGroup",
  title: "Kategori",
  type: "document",
  icon: icons.tag,
  fields: [
    localizedArrayField(
      "localizedName",
      "Navn",
      "internationalizedArrayString",
      { required: true },
    ),
    orderRankField({ type: "eventTaxonomyGroup" }),
  ],
  preview: {
    select: {
      title: "localizedName",
    },
    prepare({ title }) {
      return {
        title:
          (Array.isArray(title)
            ? title.find(item => item?.language === "nb")?.value
            : title) ?? "Gruppe",
      }
    },
  },
  orderings: [orderRankOrdering],
})
