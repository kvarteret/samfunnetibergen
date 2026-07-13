import { icons } from "@sanity/icons"
import { defineField, defineType } from "sanity"
import { isReservedPageSlug } from "../../contentPolicies"

export const page = defineType({
  name: "page",
  title: "Egendefinert side",
  description:
    "Selvstendig informasjonsside. Innhold for arrangementer, rom, grupper og andre egne områder redigeres i de tilhørende Studio-seksjonene.",
  type: "document",
  icon: icons.document,
  groups: [
    { name: "content", title: "Innhold", default: true },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Tittel",
      type: "string",
      group: "content",
      validation: rule => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "URL-slug",
      type: "slug",
      group: "content",
      options: { source: "title" },
      validation: rule =>
        rule
          .required()
          .custom(value =>
            isReservedPageSlug(value?.current)
              ? "Denne URL-en eies av en fast nettsiderute."
              : true,
          ),
    }),
    defineField({
      name: "content",
      title: "Innhold",
      type: "markdown",
      group: "content",
    }),
  ],
  preview: {
    select: { title: "title", slug: "slug.current" },
    prepare({ title, slug }) {
      return {
        title: title ?? "Side",
        subtitle: slug ? `/${slug}` : "Mangler slug",
      }
    },
  },
})
