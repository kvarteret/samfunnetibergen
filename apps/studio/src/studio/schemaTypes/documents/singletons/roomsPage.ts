import { icons } from "@sanity/icons"
import { defineArrayMember, defineField, defineType } from "sanity"
import {
  deprecatedLegacyField,
  localizedArrayField,
} from "../../shared/localizedFields"

export const roomsPage = defineType({
  name: "roomsPage",
  title: "Rom-side",
  type: "document",
  icon: icons.document,
  groups: [
    { name: "hero", title: "Hero", default: true },
    { name: "booking", title: "Bestilling" },
    { name: "floorPlans", title: "Plantegninger" },
  ],
  fields: [
    deprecatedLegacyField("eyebrow", "Eyebrow (legacy)", "string", {
      group: "hero",
    }),
    localizedArrayField(
      "localizedEyebrow",
      "Eyebrow",
      "internationalizedArrayString",
      {
        legacyField: "eyebrow",
        group: "hero",
      },
    ),
    deprecatedLegacyField("title", "Tittel (legacy)", "string", {
      group: "hero",
    }),
    localizedArrayField(
      "localizedTitle",
      "Tittel",
      "internationalizedArrayString",
      {
        required: true,
        legacyField: "title",
        group: "hero",
      },
    ),
    deprecatedLegacyField("description", "Beskrivelse (legacy)", "text", {
      rows: 4,
      group: "hero",
    }),
    localizedArrayField(
      "localizedDescription",
      "Beskrivelse",
      "internationalizedArrayText",
      { legacyField: "description", rows: 4, group: "hero" },
    ),
    defineField({
      name: "sections",
      title: "Bestillingsinformasjon",
      description:
        "Kort, praktisk informasjon som vises som kort under rom-heroen.",
      type: "array",
      group: "booking",
      of: [defineArrayMember({ type: "editorialSection" })],
    }),
    defineField({
      name: "bookingLink",
      title: "Bestillingslenke",
      type: "sourceLink",
      group: "booking",
    }),
    defineField({
      name: "floorPlans",
      title: "Plantegninger",
      description:
        "SVG-plantegninger som vises på romsider basert på rommets etasje.",
      type: "array",
      group: "floorPlans",
      of: [
        defineArrayMember({
          name: "floorPlan",
          title: "Plantegning",
          type: "object",
          icon: icons.image,
          fields: [
            defineField({
              name: "floor",
              title: "Etasje",
              type: "number",
              validation: rule => rule.required(),
            }),
            deprecatedLegacyField("title", "Tittel (legacy)", "string"),
            localizedArrayField(
              "localizedTitle",
              "Tittel",
              "internationalizedArrayString",
              { legacyField: "title" },
            ),
            defineField({
              name: "file",
              title: "SVG-fil",
              type: "file",
              options: {
                accept: "image/svg+xml",
              },
              validation: rule => rule.required(),
            }),
          ],
          preview: {
            select: { floor: "floor", title: "title" },
            prepare({ floor, title }) {
              return {
                title: title ?? (floor ? `${floor}. etasje` : "Plantegning"),
              }
            },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare({ title }) {
      return { title: title ?? "Rom-side" }
    },
  },
})
