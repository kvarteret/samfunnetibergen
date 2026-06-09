import { LinkIcon } from "@sanity/icons"
import { defineField, defineType } from "sanity"

const internalPathPattern = /^\/(?!\/)/

export const sourceLink = defineType({
  name: "sourceLink",
  title: "Link",
  type: "object",
  icon: LinkIcon,
  fields: [
    defineField({
      name: "label",
      title: "Label",
      type: "string",
      validation: rule => rule.required(),
    }),
    defineField({
      type: "string",
      name: "linkType",
      title: "Lenketype",
      initialValue: "internalPage",
      options: {
        layout: "radio",
        list: [
          { title: "Side i Sanity", value: "internalPage" },
          { title: "Intern app-sti", value: "internalPath" },
          { title: "Ekstern URL", value: "external" },
        ],
      },
      validation: rule => rule.required(),
    }),
    defineField({
      name: "internalPage",
      title: "Internt dokument",
      type: "reference",
      to: [
        { type: "homePage" },
        { type: "eventsPage" },
        { type: "roomsPage" },
        { type: "groupsPage" },
        { type: "sponsorsPage" },
        { type: "kontaktPage" },
        { type: "page" },
        { type: "arrangement" },
        { type: "room" },
        { type: "studentGroup" },
      ],
      hidden: ({ parent }) => parent?.linkType !== "internalPage",
      validation: rule =>
        rule.custom((value, context) => {
          const parent = context.parent as { linkType?: string } | undefined
          if (parent?.linkType === "internalPage" && !value?._ref) {
            return "Velg et internt dokument"
          }
          return true
        }),
    }),
    defineField({
      name: "internalPath",
      title: "Intern app-sti",
      type: "string",
      description:
        "Brukes bare for interne ruter som ikke har et Sanity-dokument.",
      hidden: ({ parent }) => parent?.linkType !== "internalPath",
      validation: rule =>
        rule.custom((value, context) => {
          const parent = context.parent as { linkType?: string } | undefined
          if (parent?.linkType !== "internalPath") return true
          if (!value) return "Skriv inn en intern sti"
          if (internalPathPattern.test(value)) return true
          return "Bruk en intern sti som starter med /"
        }),
    }),
    defineField({
      name: "externalUrl",
      title: "Ekstern URL",
      type: "url",
      hidden: ({ parent }) => parent?.linkType !== "external",
      validation: rule => rule.uri({ scheme: ["http", "https", "mailto"] }),
    }),
  ],
  validation: rule =>
    rule.custom(value => {
      if (!value) return true
      if (value.linkType === "external" && !value.externalUrl) {
        return "Skriv inn en ekstern URL"
      }
      return true
    }),
  preview: {
    select: {
      title: "label",
      linkType: "linkType",
      pageTitle: "internalPage.title",
      pageName: "internalPage.name",
      pageSlug: "internalPage.slug.current",
      pageType: "internalPage._type",
      internalPath: "internalPath",
      externalUrl: "externalUrl",
    },
    prepare({
      title,
      linkType,
      pageTitle,
      pageName,
      pageSlug,
      pageType,
      internalPath,
      externalUrl,
    }) {
      let subtitle = "Mangler lenke"
      if (linkType === "internalPage") {
        subtitle = pageSlug
          ? `/${pageSlug}`
          : (pageTitle ?? pageName ?? pageType ?? "Velg dokument")
      } else if (linkType === "internalPath") {
        subtitle = internalPath ?? "Mangler intern sti"
      } else if (linkType === "external") {
        subtitle = externalUrl ?? "Mangler ekstern URL"
      }

      return {
        title,
        subtitle,
      }
    },
  },
})
