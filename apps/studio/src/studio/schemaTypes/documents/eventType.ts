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

export const eventType = defineType({
  name: "eventType",
  title: "Arrangementtype",
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
      legacyTitle: "name",
      group: "taxonomyGroup.name",
    },
    prepare({ title, legacyTitle, group }) {
      return {
        title:
          (Array.isArray(title)
            ? title.find(item => item?.language === "nb")?.value
            : title) ??
          legacyTitle ??
          "Type",
        subtitle: group,
      }
    },
  },
  orderings: [orderRankOrdering],
})
