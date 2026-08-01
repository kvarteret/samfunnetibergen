import { icons } from "@sanity/icons"
import { defineArrayMember, defineField, defineType } from "sanity"

export const linkInBio = defineType({
  name: "linkInBio",
  title: "Link-i-bio",
  type: "document",
  icon: icons.link,
  fields: [
    defineField({
      name: "heading",
      title: "Overskrift",
      type: "string",
      description: "Vises øverst på siden, f.eks. «Kvarteret»",
      validation: rule => rule.required(),
    }),
    defineField({
      name: "bio",
      title: "Bio-tekst",
      type: "text",
      rows: 2,
      description: "Kort tekst under overskriften (valgfri)",
    }),
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
              title: "link.label",
              subtitle: "link.internalPage.title",
              href: "link.internalPath",
              externalUrl: "link.externalUrl",
              emoji: "emoji",
              media: "emojiImage",
            },
            prepare({ title, subtitle, href, externalUrl, emoji, media }) {
              return {
                title: emoji ? `${emoji}  ${title}` : title,
                subtitle: subtitle ?? href ?? externalUrl,
                media,
              }
            },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: { title: "heading" },
    prepare({ title }) {
      return { title: title ?? "Link-i-bio" }
    },
  },
})
