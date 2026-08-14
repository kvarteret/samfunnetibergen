import { icons } from "@sanity/icons"
import { defineArrayMember, defineField, defineType } from "sanity"
import {
  deprecatedLegacyField,
  localizedArrayField,
} from "../../shared/localizedFields"

export const usefulInfoPage = defineType({
  name: "usefulInfoPage",
  title: "Nyttig info",
  type: "document",
  icon: icons["info-outline"],
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore – experimental API not yet in typedefs
  __experimental_actions: ["update", "publish"],
  groups: [{ name: "content", title: "Innhold", default: true }],
  fields: [
    deprecatedLegacyField("eyebrow", "Eyebrow (legacy)", "string", {
      group: "content",
    }),
    localizedArrayField(
      "localizedEyebrow",
      "Eyebrow",
      "internationalizedArrayString",
      {
        legacyField: "eyebrow",
        group: "content",
      },
    ),
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
    deprecatedLegacyField("intro", "Ingress (legacy)", "text", {
      rows: 3,
      group: "content",
    }),
    localizedArrayField(
      "localizedIntro",
      "Ingress",
      "internationalizedArrayText",
      {
        legacyField: "intro",
        rows: 3,
        group: "content",
      },
    ),
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
  ],
  preview: {
    select: { title: "title" },
    prepare({ title }) {
      return { title: title ?? "Nyttig info" }
    },
  },
})
