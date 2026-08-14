import { icons } from "@sanity/icons"
import { defineField, defineType } from "sanity"
import {
  deprecatedLegacyField,
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
    deprecatedLegacyField("alt", "Alt Text (legacy)", "string"),
    {
      ...localizedArrayField(
        "localizedAlt",
        "Alt Text",
        "internationalizedArrayString",
        { legacyField: "alt" },
      ),
      validation: (rule: any) =>
        rule.custom((value: unknown, context: any) => {
          const parent = context.parent as { image?: unknown } | undefined
          return validateLocalizedArray(value, {
            required: Boolean(parent?.image),
            legacyField: "alt",
            context,
          })
        }),
    },
    deprecatedLegacyField("caption", "Caption (legacy)", "string"),
    localizedArrayField(
      "localizedCaption",
      "Caption",
      "internationalizedArrayString",
      { legacyField: "caption" },
    ),
  ],
  preview: {
    select: { title: "alt", media: "image" },
  },
})
