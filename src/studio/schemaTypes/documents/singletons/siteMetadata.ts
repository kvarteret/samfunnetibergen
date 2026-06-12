import { CogIcon } from "@sanity/icons"
import { defineArrayMember, defineField, defineType } from "sanity"

export const siteMetadata = defineType({
  name: "siteMetadata",
  title: "Nettstedsinfo",
  type: "document",
  icon: CogIcon,
  groups: [
    { name: "identity", title: "Identitet", default: true },
    { name: "venue", title: "Huset" },
    { name: "sharing", title: "Deling" },
  ],
  fields: [
    defineField({
      name: "siteName",
      title: "Nettstedsnavn",
      type: "string",
      group: "identity",
      initialValue: "Samfunnet i Bergen",
    }),
    defineField({
      name: "openingHours",
      title: "Driftsleder tilgjengelig",
      description:
        "Når driftsleder er tilgjengelig på huset. Brukes også som tidsrom for karaokeforespørsler.",
      type: "openingHours",
      group: "venue",
    }),
    defineField({
      name: "houseClosedDates",
      title: "Huset er stengt",
      description:
        "Hele datoer der huset er stengt. Barer regnes som stengt, og karaoke kan ikke bookes disse datoene.",
      type: "array",
      group: "venue",
      of: [
        defineArrayMember({
          name: "houseClosedDate",
          title: "Stengt dato",
          type: "object",
          fields: [
            defineField({
              name: "date",
              title: "Dato",
              type: "date",
              validation: rule => rule.required(),
            }),
            defineField({
              name: "note",
              title: "Merknad",
              type: "string",
            }),
          ],
          preview: {
            select: { date: "date", note: "note" },
            prepare({ date, note }) {
              return {
                title: date ?? "Dato mangler",
                subtitle: note ?? "Huset er stengt",
              }
            },
          },
        }),
      ],
    }),
    defineField({
      name: "defaultSeoTitle",
      title: "Standard SEO-tittel",
      type: "string",
      group: "identity",
    }),
    defineField({
      name: "defaultSeoDescription",
      title: "Standard SEO-beskrivelse",
      type: "text",
      rows: 3,
      group: "identity",
      validation: rule =>
        rule.max(160).warning("Hold deg under 160 tegn for beste SEO"),
    }),
    defineField({
      name: "defaultOpenGraphImage",
      title: "Standard Open Graph-bilde",
      type: "image",
      group: "sharing",
      options: { hotspot: true },
    }),
    defineField({
      name: "defaultOpenGraphTitle",
      title: "Standard Open Graph-tittel",
      type: "string",
      group: "sharing",
    }),
    defineField({
      name: "defaultOpenGraphDescription",
      title: "Standard Open Graph-beskrivelse",
      type: "text",
      rows: 3,
      group: "sharing",
      validation: rule => rule.max(200).warning("Hold teksten kort for deling"),
    }),
  ],
  preview: {
    select: { title: "siteName" },
    prepare({ title }) {
      return { title: title ?? "Nettstedsinfo" }
    },
  },
})
