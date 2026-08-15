import { icons } from "@sanity/icons"
import { defineField, defineType } from "sanity"
import {
  localizedArrayField,
  validateLocalizedArray,
} from "../shared/localizedFields"

export const sourcedImage = defineType({
  name: "sourcedImage",
  title: "Image",
  type: "object",
  icon: icons.image,
  fields: [
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
    }),
    {
      ...localizedArrayField(
        "localizedAlt",
        "Alt Text",
        "internationalizedArrayString",
        {},
      ),
      validation: (rule: any) =>
        rule.custom((value: unknown, context: any) => {
          const parent = context.parent as { image?: unknown } | undefined
          return validateLocalizedArray(value, {
            required: Boolean(parent?.image),
          })
        }),
    },
    localizedArrayField(
      "localizedCaption",
      "Caption",
      "internationalizedArrayString",
      {},
    ),
  ],
  preview: {
    select: { title: "alt", media: "image" },
  },
})
