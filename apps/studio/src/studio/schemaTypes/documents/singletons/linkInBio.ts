import { icons } from "@sanity/icons"
import { defineArrayMember, defineField, defineType } from "sanity"
import { localizedArrayField } from "../../shared/localizedFields"

export const linkInBio = defineType({
  name: "linkInBio",
  title: "Link-i-bio",
  type: "document",
  icon: icons.link,
  fields: [
    localizedArrayField(
      "localizedHeading",
      "Overskrift",
      "internationalizedArrayString",
      { required: true },
    ),
    localizedArrayField(
      "localizedBio",
      "Bio-tekst",
      "internationalizedArrayText",
      {},
    ),
    defineField({
      name: "links",
      title: "Lenker",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({
              name: "link",
              title: "Lenke",
              type: "sourceLink",
              validation: rule => rule.required(),
            }),
            defineField({
              name: "emoji",
              title: "Emoji-tekst (valgfri)",
              type: "string",
              description: "Brukes dersom det ikke er lastet opp et bilde.",
            }),
            defineField({
              name: "emojiImage",
              title: "Last opp emoji (valgfri)",
              type: "image",
              description:
                "Et lite, helst kvadratisk PNG-, WebP- eller JPEG-bilde som vises foran lenketeksten.",
              options: {
                hotspot: false,
              },
            }),
            defineField({
              name: "highlight",
              title: "Fremhev",
              type: "boolean",
              description: "Gjør knappen mer fremtredende",
              initialValue: false,
            }),
          ],
          preview: {
            select: {
              title: "link.localizedLabel",
              subtitle: "link.internalPage.localizedTitle",
              href: "link.internalPath",
              externalUrl: "link.externalUrl",
              emoji: "emoji",
              media: "emojiImage",
            },
            prepare({ title, subtitle, href, externalUrl, emoji, media }) {
              const localized = (value: unknown) =>
                Array.isArray(value)
                  ? value.find(item => item?.language === "nb")?.value
                  : value
              return {
                title: emoji
                  ? `${emoji}  ${localized(title) ?? ""}`
                  : localized(title),
                subtitle: localized(subtitle) ?? href ?? externalUrl,
                media,
              }
            },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: { title: "localizedHeading" },
    prepare({ title }) {
      return {
        title: Array.isArray(title)
          ? (title.find(item => item?.language === "nb")?.value ?? "Link-i-bio")
          : (title ?? "Link-i-bio"),
      }
    },
  },
})
