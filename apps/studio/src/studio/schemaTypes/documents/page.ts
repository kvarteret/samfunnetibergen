import { icons } from "@sanity/icons"
import { defineField, defineType } from "sanity"
import { isReservedPageSlug } from "../../contentPolicies"
import { localizedArrayField } from "../shared/localizedFields"

export const page = defineType({
  name: "page",
  title: "Egendefinert side",
  description:
    "Selvstendig informasjonsside. Innhold for arrangementer, rom, grupper og andre egne områder redigeres i de tilhørende Studio-seksjonene.",
  type: "document",
  icon: icons.document,
  groups: [{ name: "content", title: "Innhold", default: true }],
  fields: [
    localizedArrayField(
      "localizedTitle",
      "Tittel",
      "internationalizedArrayString",
      {
        required: true,
        group: "content",
      },
    ),
    defineField({
      name: "slug",
      title: "URL-slug",
      type: "slug",
      group: "content",
      options: {
        source: (document: Record<string, unknown>) => {
          const values = document.localizedTitle as
            | Array<{ language?: string; value?: string }>
            | undefined
          return (
            values?.find(item => item.language === "nb")?.value ??
            (document.title as string | undefined) ??
            ""
          )
        },
      },
      validation: rule =>
        rule
          .required()
          .custom(value =>
            isReservedPageSlug(value?.current)
              ? "Denne URL-en eies av en fast nettsiderute."
              : true,
          ),
    }),
    localizedArrayField(
      "localizedContent",
      "Innhold",
      "internationalizedArrayText",
      {
        description: "Markdown-innhold per språk.",
        group: "content",
      },
    ),
  ],
  preview: {
    select: {
      title: "localizedTitle",
      slug: "slug.current",
    },
    prepare({ title, slug }) {
      return {
        title:
          (Array.isArray(title)
            ? title.find(item => item?.language === "nb")?.value
            : title) ?? "Side",
        subtitle: slug ? `/${slug}` : "Mangler slug",
      }
    },
  },
})
