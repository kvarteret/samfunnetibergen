import { icons } from "@sanity/icons"
import { defineArrayMember, defineField, defineType } from "sanity"

export const siteMetadata = defineType({
  name: "siteMetadata",
  title: "Åpningstider",
  type: "document",
  icon: icons.clock,
  fields: [
    defineField({
      name: "vacationMode",
      title: "Feriemodus",
      description:
        'Når feriemodus er aktiv står åpningstidene som stengt i perioden. "Til" er datoen vi åpner igjen, og vanlige åpningstider brukes fra og med den datoen.',
      type: "object",
      fields: [
        defineField({
          name: "enabled",
          title: "FERIEMODUS aktiv",
          type: "boolean",
          initialValue: false,
        }),
        defineField({
          name: "from",
          title: "Fra",
          description: "Første dato feriemodus gjelder fra.",
          type: "date",
          hidden: ({ parent }) => parent?.enabled !== true,
          validation: rule =>
            rule.custom((value, context) => {
              const parent = context.parent as { enabled?: boolean } | undefined
              if (parent?.enabled === true && !value) {
                return "Velg datoen feriemodus starter"
              }
              return true
            }),
        }),
        defineField({
          name: "to",
          title: "Til (vi åpner igjen)",
          description:
            "Feriemodus gjelder frem til denne datoen. På selve datoen brukes vanlige åpningstider igjen.",
          type: "date",
          hidden: ({ parent }) => parent?.enabled !== true,
          validation: rule =>
            rule.custom((value, context) => {
              const parent = context.parent as
                | { enabled?: boolean; from?: string }
                | undefined
              if (parent?.enabled === true && !value) {
                return "Velg datoen vi åpner igjen"
              }
              if (value && parent?.from && value <= parent.from) {
                return "Til-datoen må være etter fra-datoen"
              }
              return true
            }),
        }),
      ],
      preview: {
        select: { enabled: "enabled", from: "from", to: "to" },
        prepare({ enabled, from, to }) {
          return {
            title: enabled ? "FERIEMODUS aktiv" : "Feriemodus av",
            subtitle: enabled
              ? `${from ?? "fra mangler"} til ${to ?? "til mangler"}`
              : "Vanlige åpningstider brukes",
          }
        },
      },
    }),
    defineField({
      name: "openingHours",
      title: "Driftsleder tilgjengelig",
      type: "openingHours",
    }),
    defineField({
      name: "houseClosedDates",
      title: "Huset er stengt",
      description:
        "Hele datoer der huset er stengt. Barer regnes som stengt, og karaoke kan ikke bookes disse datoene.",
      type: "array",
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
  ],
  preview: {
    prepare() {
      return { title: "Åpningstider" }
    },
  },
})
