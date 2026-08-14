import { icons } from "@sanity/icons"
import { defineField, defineType } from "sanity"
import { isReservedPageSlug } from "../../contentPolicies"
import {
  deprecatedLegacyField,
  localizedArrayField,
} from "../shared/localizedFields"

export const page = defineType({
  name: "page",
  title: "Egendefinert side",
  description:
    "Selvstendig informasjonsside. Innhold for arrangementer, rom, grupper og andre egne områder redigeres i de tilhørende Studio-seksjonene.",
  type: "document",
  icon: icons.document,
  groups: [{ name: "content", title: "Innhold", default: true }],
  fields: [
    deprecatedLegacyField("title", "Tittel (legacy)", "string", {
      group: "content",
    }),
    localizedArrayField(
      "localizedTitle",
      "Tittel",
      "internationalizedArrayString",
      {
        required: true,
        legacyField: "title",
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
    deprecatedLegacyField("content", "Innhold (legacy)", "markdown", {
      group: "content",
    }),
    localizedArrayField(
      "localizedContent",
      "Innhold",
      "internationalizedArrayText",
      {
        description: "Markdown-innhold per språk.",
        legacyField: "content",
        group: "content",
      },
    ),
  ],
  preview: {
    select: {
      title: "localizedTitle",
      legacyTitle: "title",
      slug: "slug.current",
    },
    prepare({ title, legacyTitle, slug }) {
      return {
        title:
          (Array.isArray(title)
            ? title.find(item => item?.language === "nb")?.value
            : title) ??
          legacyTitle ??
          "Side",
        subtitle: slug ? `/${slug}` : "Mangler slug",
      }
    },
  },
})
