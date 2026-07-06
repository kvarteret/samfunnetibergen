import { icons } from "@sanity/icons"
import { defineArrayMember, defineField, defineType } from "sanity"

import {
  createSeoFields,
  createSharingFields,
} from "../../shared/metadataFields"

export const usefulInfoPage = defineType({
  name: "usefulInfoPage",
  title: "Nyttig info",
  type: "document",
  icon: icons["info-outline"],
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore – experimental API not yet in typedefs
  __experimental_actions: ["update", "publish"],
  groups: [
    { name: "content", title: "Innhold", default: true },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    defineField({
      name: "eyebrow",
      title: "Eyebrow",
      type: "string",
      group: "content",
    }),
    defineField({
      name: "title",
      title: "Tittel",
      type: "string",
      group: "content",
      initialValue: "Nyttig info",
      validation: rule => rule.required(),
    }),
    defineField({
      name: "intro",
      title: "Ingress",
      type: "text",
      rows: 3,
      group: "content",
    }),
    defineField({
      name: "sections",
      title: "Seksjoner",
      description:
        "Praktiske temaer som vises som egne blokker. Kan endres rekkefølge på, legges til og fjernes.",
      type: "array",
      group: "content",
      of: [
        defineArrayMember({ type: "infoAddressBlock" }),
        defineArrayMember({ type: "editorialSection" }),
        defineArrayMember({ type: "infoAccordionBlock" }),
      ],
    }),
    ...createSeoFields(),
    ...createSharingFields({ group: "seo" }),
  ],
  preview: {
    select: { title: "title" },
    prepare({ title }) {
      return { title: title ?? "Nyttig info" }
    },
  },
})
