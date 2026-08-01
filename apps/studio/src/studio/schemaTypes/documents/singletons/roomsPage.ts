import { icons } from "@sanity/icons"
import { defineArrayMember, defineField, defineType } from "sanity"

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
    defineField({
      name: "eyebrow",
      title: "Eyebrow",
      type: "string",
      group: "hero",
    }),
    defineField({
      name: "title",
      title: "Tittel",
      type: "string",
      group: "hero",
      validation: rule => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Beskrivelse",
      type: "text",
      rows: 4,
      group: "hero",
    }),
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
            defineField({
              name: "title",
              title: "Tittel",
              type: "string",
            }),
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
