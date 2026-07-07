import { icons } from "@sanity/icons"
import { defineField, defineType } from "sanity"
import { isReservedPageSlug } from "../../contentPolicies"
import { createSeoFields, createSharingFields } from "../shared/metadataFields"

export const page = defineType({
  name: "page",
  title: "Egendefinert side",
  description:
    "Selvstendig informasjonsside. Innhold for arrangementer, rom, grupper og andre egne områder redigeres i de tilhørende Studio-seksjonene.",
  type: "document",
  icon: icons.document,
  groups: [
    { name: "content", title: "Innhold", default: true },
    { name: "seo", title: "SEO" },
    { name: "sharing", title: "Deling" },
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
    ...createSeoFields(),
    ...createSharingFields(),
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
