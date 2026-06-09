import { ImageIcon } from "@sanity/icons"
import { defineField, defineType } from "sanity"

export const sourcedImage = defineType({
  name: "sourcedImage",
  title: "Image",
  type: "object",
  icon: ImageIcon,
  fields: [
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "alt",
      title: "Alt Text",
      type: "string",
      validation: rule =>
        rule.custom((alt, ctx) => {
          const parent = ctx.parent as { image?: unknown } | undefined
          if (parent?.image && !alt)
            return "Alt-tekst er påkrevd når bilde er lastet opp."
          return true
        }),
    }),
    defineField({
      name: "caption",
      title: "Caption",
      type: "string",
    }),
  ],
  preview: {
    select: { title: "alt", media: "image" },
  },
})
