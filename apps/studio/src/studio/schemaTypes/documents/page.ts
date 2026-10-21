import { FAQ_ICONS } from "@samfunnet/content-domain/faq-icons"
import { icons } from "@sanity/icons"
import { defineArrayMember, defineField, defineType } from "sanity"
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
    localizedArrayField(
      "localizedSubmittedTitle",
      "Innsendt: tittel",
      "internationalizedArrayString",
      {
        description:
          "Overskrift etter innsendt booking. Tom bruker standardteksten.",
        group: "content",
      },
    ),
    localizedArrayField(
      "localizedSubmittedKaraokeTitle",
      "Innsendt: tittel for karaoke",
      "internationalizedArrayString",
      {
        description:
          "Overskrift etter innsendt karaokebooking. Tom bruker standardteksten.",
        group: "content",
      },
    ),
    localizedArrayField(
      "localizedSubmittedDescription",
      "Innsendt: tekst",
      "internationalizedArrayText",
      {
        description:
          "Tekst under overskriften etter innsendt booking. Tom bruker standardteksten.",
        group: "content",
      },
    ),
    defineField({
      name: "faq",
      title: "Spørsmål og svar",
      description:
        "Vises som trekkspill på spørsmål om booking. Erstatter spørsmålene i Markdown når utfylt.",
      type: "array",
      group: "content",
      of: [
        defineArrayMember({
          name: "faqItem",
          type: "object",
          fields: [
            defineField({
              name: "icon",
              title: "Ikon",
              description: "Vises foran spørsmålet. Valgfritt.",
              type: "string",
              options: {
                list: FAQ_ICONS.map(({ name, title }) => ({
                  title,
                  value: name,
                })),
              },
            }),
            localizedArrayField(
              "localizedQuestion",
              "Spørsmål",
              "internationalizedArrayString",
              { required: true },
            ),
            localizedArrayField(
              "localizedAnswer",
              "Svar",
              "internationalizedArrayText",
              { required: true, description: "Markdown er støttet." },
            ),
          ],
          preview: {
            select: { title: "localizedQuestion" },
            prepare({ title }) {
              return {
                title:
                  title?.find(
                    (item: { language?: string }) => item.language === "nb",
                  )?.value ?? "Spørsmål",
              }
            },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: "localizedTitle",
      legacyTitle: "title",
      slug: "slug.current",
    },
    prepare({ title, legacyTitle, slug }) {
      const localizedTitle = Array.isArray(title)
        ? title.find(
            item =>
              item?.language === "nb" &&
              typeof item.value === "string" &&
              item.value.trim(),
          )?.value
        : typeof title === "string" && title.trim()
          ? title
          : undefined
      const fallbackTitle =
        typeof legacyTitle === "string" && legacyTitle.trim()
          ? legacyTitle
          : slug
            ? slug
                .replace(/[-_]+/g, " ")
                .replace(/^./, (value: string) => value.toUpperCase())
            : "Side"
      return {
        title: localizedTitle ?? fallbackTitle,
        subtitle: slug ? `/${slug}` : "Mangler slug",
      }
    },
  },
})
