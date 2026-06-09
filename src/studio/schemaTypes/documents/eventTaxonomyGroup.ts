import { TagIcon } from "@sanity/icons";
import {
  orderRankField,
  orderRankOrdering,
} from "@sanity/orderable-document-list";
import { defineField, defineType } from "sanity";

export const eventTaxonomyGroup = defineType({
  name: "eventTaxonomyGroup",
  title: "Kategori",
  type: "document",
  icon: TagIcon,
  fields: [
    defineField({
      name: "name",
      title: "Navn",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "isActive",
      title: "Aktiv",
      type: "boolean",
      initialValue: true,
    }),
    orderRankField({ type: "eventTaxonomyGroup" }),
  ],
  preview: {
    select: {
      title: "name",
    },
    prepare({ title }) {
      return { title: title ?? "Gruppe" };
    },
  },
  orderings: [orderRankOrdering],
});
