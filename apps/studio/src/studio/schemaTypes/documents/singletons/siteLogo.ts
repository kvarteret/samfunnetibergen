import { icons } from "@sanity/icons"
import { defineField, defineType } from "sanity"

export const siteLogo = defineType({
  name: "siteLogo",
  title: "Logo",
  type: "document",
  icon: icons.image,
  fields: [
    defineField({
      name: "logo",
      title: "Logo",
      description:
        "Logoen som vises øverst på nettsiden (navigasjon og mobilmeny). La feltet stå tomt for å bruke standardlogoen.",
      type: "image",
      options: {
        hotspot: true,
      },
    }),
  ],
  preview: {
    select: { media: "logo" },
    prepare({ media }) {
      return { title: "Logo", media }
    },
  },
})
