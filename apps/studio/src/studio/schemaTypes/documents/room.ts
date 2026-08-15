import { icons } from "@sanity/icons"
import { orderRankField } from "@sanity/orderable-document-list"
import { defineArrayMember, defineField, defineType } from "sanity"
import { localizedArrayField } from "../shared/localizedFields"

export const room = defineType({
  name: "room",
  title: "Rom",
  type: "document",
  icon: icons.component,
  groups: [
    { name: "info", title: "Info", default: true },
    { name: "menu", title: "Meny" },
    { name: "specs", title: "Tekniske specs" },
    { name: "hours", title: "Åpningstid" },
    { name: "media", title: "Bilder" },
  ],
  fields: [
    localizedArrayField(
      "localizedTitle",
      "Navn",
      "internationalizedArrayString",
      {
        required: true,
        group: "info",
      },
    ),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "info",
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
      validation: rule => rule.required(),
    }),
    localizedArrayField(
      "localizedSummary",
      "Kort beskrivelse",
      "internationalizedArrayText",
      {
        required: true,
        rows: 3,
        group: "info",
      },
    ),
    localizedArrayField(
      "localizedBody",
      "Fullstendig beskrivelse",
      "internationalizedArrayPortableTextContent",
      { group: "info" },
    ),
    defineField({
      name: "crescatRoomId",
      title: "Crescat rom-ID",
      description:
        "Romnummeret i Crescat. Brukes for å sende bookingforespørsler til riktig rom. Hentes fra Crescat-bookingskjemaet. Rom uten ID kan ikke bookes via nettsiden.",
      type: "number",
      group: "info",
      validation: rule => rule.integer().positive(),
    }),
    defineField({
      name: "pricePerHour",
      title: "Timepris",
      description:
        "Romleie per time for eksterne bookere. Stå tomt for rom som ikke leies ut separat. Interne og studentorganisasjoner betaler ikke romleie.",
      type: "number",
      group: "info",
      validation: rule => rule.min(0),
    }),
    defineField({
      name: "menu",
      title: "Meny",
      description: "Menyen som serveres i dette rommet / baren",
      type: "menu",
      group: "menu",
    }),
    orderRankField({ type: "room" }),

    // — Tech specs —
    defineField({
      name: "floor",
      title: "Etasje",
      type: "number",
      group: "specs",
    }),
    defineField({
      name: "capacityStanding",
      title: "Stående kapasitet",
      description: "Antall stående gjester (branntillatelse)",
      type: "number",
      group: "specs",
    }),
    defineField({
      name: "capacitySeated",
      title: "Sittende kapasitet",
      type: "number",
      group: "specs",
    }),
    defineField({
      name: "suitedPurposes",
      title: "Passer til",
      description: "Bruksområder, f.eks. Foredrag, fest, debatt",
      type: "array",
      group: "specs",
      of: [defineArrayMember({ type: "string" })],
      options: {
        layout: "tags",
      },
    }),
    localizedArrayField(
      "localizedSuitedPurposes",
      "Passer til (per språk)",
      "internationalizedArrayText",
      {
        description:
          "Ett bruksområde per linje. Brukes på nettsiden i valgt språk.",
        rows: 3,
        group: "specs",
      },
    ),
    localizedArrayField("localizedBar", "Bar", "internationalizedArrayString", {
      group: "specs",
    }),
    defineField({
      name: "hasSound",
      title: "Lyd",
      type: "boolean",
      initialValue: false,
      group: "specs",
    }),
    localizedArrayField(
      "localizedSoundDetails",
      "Detaljer om lyd",
      "internationalizedArrayString",
      {
        group: "specs",
      },
    ),
    defineField({
      name: "hasLighting",
      title: "Lys",
      type: "boolean",
      initialValue: false,
      group: "specs",
    }),
    localizedArrayField(
      "localizedLightingDetails",
      "Detaljer om lys",
      "internationalizedArrayString",
      {
        group: "specs",
      },
    ),
    defineField({
      name: "hasAV",
      title: "A/V",
      type: "boolean",
      initialValue: false,
      group: "specs",
    }),
    localizedArrayField(
      "localizedAvDetails",
      "Detaljer om A/V",
      "internationalizedArrayString",
      {
        group: "specs",
      },
    ),
    defineField({
      name: "specsUrl",
      title: "Tekniske spesifikasjoner (lenke)",
      description: "URL til PDF eller dokument med tekniske spesifikasjoner",
      type: "url",
      group: "specs",
      validation: rule => rule.uri({ scheme: ["http", "https"] }),
    }),

    // — Opening hours —
    defineField({
      name: "openingHours",
      title: "Åpningstider",
      type: "openingHours",
      group: "hours",
    }),

    // — Media —
    defineField({
      name: "panoramaUrl",
      title: "360° visning (Google Maps embed-URL)",
      description:
        "Lim inn iframe src-URL fra Google Maps for å vise 360°-visning som første bilde",
      type: "url",
      group: "media",
      validation: rule => rule.uri({ scheme: ["https"] }),
    }),
    defineField({
      name: "images",
      title: "Bilder",
      type: "array",
      group: "media",
      of: [defineArrayMember({ type: "sourcedImage" })],
    }),
  ],
  preview: {
    select: {
      title: "localizedTitle",
      standing: "capacityStanding",
      seated: "capacitySeated",
      pricePerHour: "pricePerHour",
      media: "images.0.image",
    },
    prepare({ title, standing, seated, pricePerHour, media }) {
      const parts: string[] = []
      if (standing || seated) {
        parts.push(`${standing ?? "?"} stående / ${seated ?? "?"} sittende`)
      }
      if (pricePerHour != null) {
        parts.push(`${pricePerHour} kr/t`)
      }
      const subtitle = parts.join(" · ")
      return {
        title:
          (Array.isArray(title)
            ? title.find(item => item?.language === "nb")?.value
            : title) ?? "Rom",
        subtitle,
        media,
      }
    },
  },
})
