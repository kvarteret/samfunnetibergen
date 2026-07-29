import { icons } from "@sanity/icons"
import {
  orderRankField,
  orderRankOrdering,
} from "@sanity/orderable-document-list"
import { defineField, defineType } from "sanity"

export const eventTaxonomyGroup = defineType({
  name: "eventTaxonomyGroup",
  title: "Kategori",
  type: "document",
  icon: icons.tag,
  fields: [
    defineField({
      name: "name",
      title: "Navn",
      type: "string",
      validation: rule => rule.required(),
    }),
    orderRankField({ type: "eventTaxonomyGroup" }),
  ],
  preview: {
    select: {
      title: "name",
    },
    prepare({ title }) {
      return { title: title ?? "Gruppe" }
    },
  },
  orderings: [orderRankOrdering],
})
