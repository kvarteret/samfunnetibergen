import { icons } from "@sanity/icons"
import {
  orderRankField,
  orderRankOrdering,
} from "@sanity/orderable-document-list"
import { defineField, defineType } from "sanity"

export const eventType = defineType({
  name: "eventType",
  title: "Arrangementtype",
  type: "document",
  icon: icons.tag,
  fields: [
    defineField({
      name: "name",
      title: "Navn",
      type: "string",
      validation: rule => rule.required(),
    }),
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
      title: "name",
      group: "taxonomyGroup.name",
    },
    prepare({ title, group }) {
      return { title: title ?? "Type", subtitle: group }
    },
  },
  orderings: [orderRankOrdering],
})
