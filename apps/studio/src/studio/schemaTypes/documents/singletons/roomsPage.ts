import { icons } from "@sanity/icons"
import { defineArrayMember, defineField, defineType } from "sanity"
import { localizedArrayField } from "../../shared/localizedFields"

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
    localizedArrayField(
      "localizedEyebrow",
      "Eyebrow",
      "internationalizedArrayString",
      {
        group: "hero",
      },
    ),
    localizedArrayField(
      "localizedTitle",
      "Tittel",
      "internationalizedArrayString",
      {
        required: true,
        group: "hero",
      },
    ),
    localizedArrayField(
      "localizedDescription",
      "Beskrivelse",
      "internationalizedArrayText",
      { rows: 4, group: "hero" },
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
            localizedArrayField(
              "localizedTitle",
              "Tittel",
              "internationalizedArrayString",
              {},
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
            select: { floor: "floor", title: "localizedTitle" },
            prepare({ floor, title }) {
              const localizedTitle = Array.isArray(title)
                ? title.find(item => item?.language === "nb")?.value
                : title
              return {
                title:
                  localizedTitle ??
                  (floor ? `${floor}. etasje` : "Plantegning"),
              }
            },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: { title: "localizedTitle" },
    prepare({ title }) {
      return {
        title: Array.isArray(title)
          ? (title.find(item => item?.language === "nb")?.value ?? "Rom-side")
          : (title ?? "Rom-side"),
      }
    },
  },
})
