import { StarIcon } from "@sanity/icons/Star"
import { defineField, defineType } from "sanity"

export const internbevisBenefit = defineType({
  name: "internbevisBenefit",
  title: "Frivilligfordel",
  type: "document",
  icon: StarIcon,
  fields: [
    defineField({
      name: "name",
      title: "Fordel",
      type: "string",
      validation: rule => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Kort beskrivelse",
      type: "text",
      rows: 3,
      validation: rule => rule.max(220),
    }),
    defineField({
      name: "minimumTier",
      title: "Gyldig fra",
      type: "string",
      options: {
        list: [
          { title: "Trinn 1 – Brukerorganisasjon (Borg)", value: "trinn1" },
          { title: "Trinn 2 – Driftsorganisasjon (Dorg)", value: "trinn2" },
          { title: "Trinn 3 – Arbeidsgruppe (Arg)", value: "trinn3" },
        ],
        layout: "radio",
      },
      validation: rule => rule.required(),
    }),
  ],
  preview: {
    select: { title: "name", minimumTier: "minimumTier" },
    prepare({ title, minimumTier }) {
      const tierLabels: Record<string, string> = {
        trinn1: "Trinn 1",
        trinn2: "Trinn 2",
        trinn3: "Trinn 3",
      }
      return {
        title: title ?? "Fordel",
        subtitle: minimumTier
          ? `Gyldig fra ${tierLabels[minimumTier]}`
          : "Gyldig fra mangler",
      }
    },
  },
})
