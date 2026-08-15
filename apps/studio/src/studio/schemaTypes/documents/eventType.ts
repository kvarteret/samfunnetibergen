import { icons } from "@sanity/icons"
import {
  orderRankField,
  orderRankOrdering,
} from "@sanity/orderable-document-list"
import { defineField, defineType } from "sanity"
import { localizedArrayField } from "../shared/localizedFields"

export const eventType = defineType({
  name: "eventType",
  title: "Arrangementtype",
  type: "document",
  icon: icons.tag,
  fields: [
    localizedArrayField(
      "localizedName",
      "Navn",
      "internationalizedArrayString",
      { required: true },
    ),
    defineField({
      name: "taxonomyGroup",
      title: "Kategori",
      type: "reference",
      to: [{ type: "eventTaxonomyGroup" }],
      validation: rule => rule.required(),
    }),
    defineField({
      name: "isActive",
      title: "Aktiv",
      type: "boolean",
      initialValue: true,
    }),
    orderRankField({ type: "eventType" }),
  ],
  preview: {
    select: {
      title: "localizedName",
      group: "taxonomyGroup.localizedName",
    },
    prepare({ title, group }) {
      const localized = (value: unknown) =>
        Array.isArray(value)
          ? value.find(item => item?.language === "nb")?.value
          : value
      return {
        title: localized(title) ?? "Type",
        subtitle: localized(group),
      }
    },
  },
  orderings: [orderRankOrdering],
})
